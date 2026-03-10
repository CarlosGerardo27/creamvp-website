param(
  [string]$EnvFile = ".env",
  [string]$Email,
  [SecureString]$Password,
  [bool]$AutoSeedReferenceData = $true,
  [switch]$SkipPublish,
  [switch]$DeleteAtEnd,
  [string]$FunctionsBaseUrl
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "[smoke-cms] $Message" -ForegroundColor Cyan
}

function Read-EnvMap {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "No existe archivo de entorno: $Path"
  }

  $map = @{}
  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.StartsWith("#")) { continue }
    if (-not $trimmed.Contains("=")) { continue }

    $parts = $trimmed -split "=", 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($key.Length -gt 0) {
      $map[$key] = $value
    }
  }

  return $map
}

function Convert-SecureToPlainText {
  param([SecureString]$SecureValue)

  if ($null -eq $SecureValue) {
    return $null
  }

  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Invoke-JsonRequest {
  param(
    [ValidateSet("GET", "POST", "PATCH", "DELETE")]
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers,
    [object]$Body,
    [int[]]$ExpectedStatusCodes = @(200)
  )

  try {
    if ($null -ne $Body) {
      $jsonBody = $Body | ConvertTo-Json -Depth 30
      $response = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -Body $jsonBody -ContentType "application/json" -UseBasicParsing
    } else {
      $response = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -UseBasicParsing
    }
  } catch {
    $statusCode = $null
    $errorBody = $null

    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      if ($resp.StatusCode) {
        $statusCode = [int]$resp.StatusCode
      }

      if (-not [string]::IsNullOrWhiteSpace($_.ErrorDetails.Message)) {
        $errorBody = $_.ErrorDetails.Message
      } else {
        try {
          $stream = $resp.GetResponseStream()
          if ($null -ne $stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
            $reader.Close()
          }
        } catch {
          # Ignore stream parsing errors and fallback below.
        }
      }
    }

    if ([string]::IsNullOrWhiteSpace($errorBody)) {
      $errorBody = $_.Exception.Message
    }

    throw "HTTP $Method $Url fallo. Status: $statusCode. Body: $errorBody"
  }

  if ($ExpectedStatusCodes -notcontains [int]$response.StatusCode) {
    throw "HTTP $Method $Url devolvio status inesperado: $($response.StatusCode). Body: $($response.Content)"
  }

  if ([string]::IsNullOrWhiteSpace($response.Content)) {
    return [PSCustomObject]@{
      statusCode = [int]$response.StatusCode
      body = $null
    }
  }

  return [PSCustomObject]@{
    statusCode = [int]$response.StatusCode
    body = ($response.Content | ConvertFrom-Json)
  }
}

function Get-FirstRow {
  param([object]$Body)

  if ($null -eq $Body) {
    return $null
  }

  if ($Body -is [System.Array]) {
    if ($Body.Count -eq 0) { return $null }
    return $Body[0]
  }

  return $Body
}

function New-Slug {
  param([string]$Prefix)

  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  return "$Prefix-$timestamp"
}

function Resolve-FunctionsBaseUrl {
  param(
    [string]$SupabaseUrl,
    [string]$OverrideBaseUrl
  )

  if (-not [string]::IsNullOrWhiteSpace($OverrideBaseUrl)) {
    return $OverrideBaseUrl.TrimEnd("/")
  }

  $uri = [System.Uri]$SupabaseUrl
  $hostParts = $uri.Host.Split(".")
  if ($hostParts.Length -lt 3) {
    throw "No se pudo derivar project-ref desde SUPABASE_URL: $SupabaseUrl"
  }

  $projectRef = $hostParts[0]
  return "https://$projectRef.functions.supabase.co"
}

function Get-OrCreateCategory {
  param(
    [string]$BaseUrl,
    [hashtable]$Headers,
    [bool]$AutoSeed
  )

  $url = "$BaseUrl/rest/v1/categories?select=id,slug,name&is_active=eq.true&order=created_at.asc&limit=1"
  $res = Invoke-JsonRequest -Method GET -Url $url -Headers $Headers
  $row = Get-FirstRow $res.body
  if ($null -ne $row) {
    return $row
  }

  if (-not $AutoSeed) {
    throw "No hay categorias activas y AutoSeedReferenceData esta en false."
  }

  $slug = New-Slug -Prefix "smoke-category"
  $payload = @{
    name = "Smoke Category"
    slug = $slug
    description = "Categoria de smoke test"
    seo = @{}
  }
  $seedHeaders = @{} + $Headers
  $seedHeaders["Prefer"] = "return=representation"

  $create = Invoke-JsonRequest -Method POST -Url "$BaseUrl/rest/v1/categories" -Headers $seedHeaders -Body $payload -ExpectedStatusCodes @(201)
  $created = Get-FirstRow $create.body
  if ($null -eq $created) {
    throw "No se pudo crear categoria de smoke test."
  }
  return $created
}

function Get-OrCreateAuthor {
  param(
    [string]$BaseUrl,
    [hashtable]$Headers,
    [bool]$AutoSeed
  )

  $url = "$BaseUrl/rest/v1/authors?select=id,slug,name&is_active=eq.true&order=created_at.asc&limit=1"
  $res = Invoke-JsonRequest -Method GET -Url $url -Headers $Headers
  $row = Get-FirstRow $res.body
  if ($null -ne $row) {
    return $row
  }

  if (-not $AutoSeed) {
    throw "No hay autores activos y AutoSeedReferenceData esta en false."
  }

  $slug = New-Slug -Prefix "smoke-author"
  $payload = @{
    name = "Smoke Author"
    slug = $slug
    bio = "Autor temporal para smoke test"
  }
  $seedHeaders = @{} + $Headers
  $seedHeaders["Prefer"] = "return=representation"

  $create = Invoke-JsonRequest -Method POST -Url "$BaseUrl/rest/v1/authors" -Headers $seedHeaders -Body $payload -ExpectedStatusCodes @(201)
  $created = Get-FirstRow $create.body
  if ($null -eq $created) {
    throw "No se pudo crear autor de smoke test."
  }
  return $created
}

function Get-OrCreateTag {
  param(
    [string]$BaseUrl,
    [hashtable]$Headers,
    [bool]$AutoSeed
  )

  $url = "$BaseUrl/rest/v1/tags?select=id,slug,name&is_active=eq.true&order=created_at.asc&limit=1"
  $res = Invoke-JsonRequest -Method GET -Url $url -Headers $Headers
  $row = Get-FirstRow $res.body
  if ($null -ne $row) {
    return $row
  }

  if (-not $AutoSeed) {
    return $null
  }

  $slug = New-Slug -Prefix "smoke-tag"
  $payload = @{
    name = "Smoke Tag"
    slug = $slug
    description = "Tag temporal para smoke test"
    seo = @{}
  }
  $seedHeaders = @{} + $Headers
  $seedHeaders["Prefer"] = "return=representation"

  $create = Invoke-JsonRequest -Method POST -Url "$BaseUrl/rest/v1/tags" -Headers $seedHeaders -Body $payload -ExpectedStatusCodes @(201)
  $created = Get-FirstRow $create.body
  return $created
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $projectRoot $EnvFile }

Write-Step "Leyendo variables desde $envPath"
$envMap = Read-EnvMap -Path $envPath
$supabaseUrl = $envMap["PUBLIC_SUPABASE_URL"]
$anonKey = $envMap["PUBLIC_SUPABASE_ANON_KEY"]

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($anonKey)) {
  throw "Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en $envPath"
}

$functionsApiBase = Resolve-FunctionsBaseUrl -SupabaseUrl $supabaseUrl -OverrideBaseUrl $FunctionsBaseUrl
Write-Step "Usando Functions API base: $functionsApiBase"

if ([string]::IsNullOrWhiteSpace($Email)) {
  $Email = Read-Host "Email de usuario CMS"
}
if ([string]::IsNullOrWhiteSpace($Email)) {
  throw "Email es requerido."
}

if ($null -eq $Password) {
  $Password = Read-Host "Password Supabase" -AsSecureString
}
$plainPassword = Convert-SecureToPlainText -SecureValue $Password
if ([string]::IsNullOrWhiteSpace($plainPassword)) {
  throw "Password es requerido."
}

Write-Step "Autenticando usuario en Supabase Auth"
$authHeaders = @{
  apikey = $anonKey
  "Content-Type" = "application/json"
}
$authPayload = @{
  email = $Email
  password = $plainPassword
}
$authResponse = Invoke-JsonRequest -Method POST -Url "$supabaseUrl/auth/v1/token?grant_type=password" -Headers $authHeaders -Body $authPayload -ExpectedStatusCodes @(200)
$jwt = $authResponse.body.access_token
$userId = $authResponse.body.user.id

if ([string]::IsNullOrWhiteSpace($jwt) -or [string]::IsNullOrWhiteSpace($userId)) {
  throw "No se pudo obtener JWT o user.id."
}

$apiHeaders = @{
  apikey = $anonKey
  Authorization = "Bearer $jwt"
}

Write-Step "Validando perfil editorial"
$profileRes = Invoke-JsonRequest -Method GET -Url "$supabaseUrl/rest/v1/profiles?id=eq.$userId&select=id,role,is_active&limit=1" -Headers $apiHeaders
$profile = Get-FirstRow $profileRes.body
if ($null -eq $profile) {
  throw "No existe profile para el usuario autenticado."
}
if (-not $profile.is_active) {
  throw "El profile del usuario esta inactivo."
}

$role = [string]$profile.role
Write-Step "Perfil detectado: role=$role userId=$userId"

if (@("admin", "editor") -notcontains $role) {
  throw "El smoke test requiere role admin/editor para create y update. Role actual: $role"
}

Write-Step "Buscando o creando categoria, autor y tag de referencia"
$category = Get-OrCreateCategory -BaseUrl $supabaseUrl -Headers $apiHeaders -AutoSeed:$AutoSeedReferenceData
$author = Get-OrCreateAuthor -BaseUrl $supabaseUrl -Headers $apiHeaders -AutoSeed:$AutoSeedReferenceData
$tag = Get-OrCreateTag -BaseUrl $supabaseUrl -Headers $apiHeaders -AutoSeed:$AutoSeedReferenceData

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$slug = "smoke-$timestamp"
$expectedCanonical = "https://creamvp.com/blog/$($category.slug)/$slug"
$imageUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80"

$requestIdCreate = [guid]::NewGuid().ToString()
$requestIdUpdate = [guid]::NewGuid().ToString()
$requestIdScheduled = [guid]::NewGuid().ToString()
$requestIdPublished = [guid]::NewGuid().ToString()
$requestIdDelete = [guid]::NewGuid().ToString()

$functionHeaders = @{
  apikey = $anonKey
  Authorization = "Bearer $jwt"
  "Content-Type" = "application/json"
}

Write-Step "1/4 Create draft en cms-blog-create"
$createPayload = @{
  slug = $slug
  categoryId = $category.id
  h1 = "Smoke test $timestamp"
  metaDescription = "Meta description smoke test $timestamp"
  canonicalUrl = $expectedCanonical
  shortDescription = "Short description smoke test $timestamp"
  featuredImage = @{
    url = $imageUrl
    alt = "Imagen destacada para smoke test CMS"
    metadata = @{
      width = 1600
      height = 900
      provider = "unsplash"
    }
  }
  authorId = $author.id
  contentMarkdown = "# Smoke test $timestamp`nContenido inicial para validar endpoint create."
  seo = @{
    title = "SEO Smoke Test $timestamp"
    robots = "index,follow"
  }
  faqs = @(
    @{
      question = "Que valida este smoke test?"
      answer = "Valida create, update, status y SEO canonical."
      position = 0
    }
  )
}

if ($null -ne $tag) {
  $createPayload["tags"] = @($tag.id)
}

$createHeaders = @{} + $functionHeaders
$createHeaders["x-request-id"] = $requestIdCreate
$createRes = Invoke-JsonRequest -Method POST -Url "$functionsApiBase/cms-blog-create" -Headers $createHeaders -Body $createPayload -ExpectedStatusCodes @(201)
$postId = $createRes.body.data.id
if ([string]::IsNullOrWhiteSpace($postId)) {
  throw "create no devolvio data.id"
}
Write-Step "Create OK: postId=$postId status=$($createRes.body.data.status)"

Write-Step "2/4 Update draft en cms-blog-update"
$updatePayload = @{
  postId = $postId
  patch = @{
    h1 = "Smoke test actualizado $timestamp"
    metaDescription = "Meta actualizada smoke test $timestamp"
    shortDescription = "Short description actualizada smoke test $timestamp"
    contentMarkdown = "## Update smoke test`nContenido actualizado para validar endpoint update."
  }
  faqs = @(
    @{
      question = "El update funciona?"
      answer = "Si, el endpoint update responde 200."
      position = 0
    }
  )
}

if ($null -ne $tag) {
  $updatePayload["tags"] = @($tag.id)
}

$updateHeaders = @{} + $functionHeaders
$updateHeaders["x-request-id"] = $requestIdUpdate
$updateRes = Invoke-JsonRequest -Method PATCH -Url "$functionsApiBase/cms-blog-update" -Headers $updateHeaders -Body $updatePayload -ExpectedStatusCodes @(200)
Write-Step "Update OK: status=$($updateRes.body.data.status)"

Write-Step "3/4 Status draft -> scheduled en cms-blog-status"
$scheduledAt = (Get-Date).ToUniversalTime().AddMinutes(15).ToString("o")
$statusScheduledPayload = @{
  postId = $postId
  status = "scheduled"
  scheduledPublishAt = $scheduledAt
  changeReason = "Smoke test schedule"
}
$scheduledHeaders = @{} + $functionHeaders
$scheduledHeaders["x-request-id"] = $requestIdScheduled
$scheduledRes = Invoke-JsonRequest -Method PATCH -Url "$functionsApiBase/cms-blog-status" -Headers $scheduledHeaders -Body $statusScheduledPayload -ExpectedStatusCodes @(200)
Write-Step "Status scheduled OK: status=$($scheduledRes.body.data.status)"

$publishExecuted = $false
if (-not $SkipPublish) {
  if (@("admin", "reviewer") -contains $role) {
    Write-Step "4/4 Status scheduled -> published en cms-blog-status"
    $statusPublishedPayload = @{
      postId = $postId
      status = "published"
      changeReason = "Smoke test publish"
    }
    $publishedHeaders = @{} + $functionHeaders
    $publishedHeaders["x-request-id"] = $requestIdPublished
    $publishedRes = Invoke-JsonRequest -Method PATCH -Url "$functionsApiBase/cms-blog-status" -Headers $publishedHeaders -Body $statusPublishedPayload -ExpectedStatusCodes @(200)
    Write-Step "Status published OK: status=$($publishedRes.body.data.status)"
    $publishExecuted = $true
  } else {
    Write-Step "Se omite publish porque role=$role no permite transicion a published."
  }
} else {
  Write-Step "Publish omitido por parametro -SkipPublish."
}

Write-Step "Validando registro final en blog_posts"
$postRes = Invoke-JsonRequest -Method GET -Url "$supabaseUrl/rest/v1/blog_posts?id=eq.$postId&select=id,status,slug,category_slug,canonical_url,publish_date,scheduled_publish_at,updated_at" -Headers $apiHeaders
$post = Get-FirstRow $postRes.body
if ($null -eq $post) {
  throw "No se encontro el blog post creado."
}

if ($post.canonical_url -ne $expectedCanonical) {
  throw "Canonical URL invalida. Esperada: $expectedCanonical | Actual: $($post.canonical_url)"
}

$expectedPath = "https://creamvp.com/blog/$($post.category_slug)/$($post.slug)"
if ($post.canonical_url -ne $expectedPath) {
  throw "Estructura SEO invalida. Debe ser creamvp.com/blog/[categoria]/[slug]. Actual: $($post.canonical_url)"
}

if ($publishExecuted -and $post.status -ne "published") {
  throw "Se esperaba status=published y se obtuvo status=$($post.status)"
}

if (-not $publishExecuted -and $post.status -ne "scheduled") {
  throw "Se esperaba status=scheduled y se obtuvo status=$($post.status)"
}

Write-Step "Validando logs en cms_api_request_log"
$logIds = @($requestIdCreate, $requestIdUpdate, $requestIdScheduled)
if ($publishExecuted) {
  $logIds += $requestIdPublished
}
$inClause = ($logIds | ForEach-Object { "`"$_`"" }) -join ","
$logsRes = Invoke-JsonRequest -Method GET -Url "$supabaseUrl/rest/v1/cms_api_request_log?select=request_id,endpoint,status_code,created_at&request_id=in.($inClause)&order=created_at.asc" -Headers $apiHeaders
$logs = @($logsRes.body)

if ($logs.Count -lt $logIds.Count) {
  throw "Faltan logs de auditoria. Esperados: $($logIds.Count) | Encontrados: $($logs.Count)"
}

$deleteExecuted = $false
if ($DeleteAtEnd) {
  if ($role -ne "admin") {
    throw "Delete requiere role admin. Role actual: $role"
  }

  Write-Step "5/5 Delete post en cms-blog-delete"
  $deletePayload = @{
    postId = $postId
    changeReason = "Smoke cleanup delete"
  }
  $deleteHeaders = @{} + $functionHeaders
  $deleteHeaders["x-request-id"] = $requestIdDelete
  $deleteRes = Invoke-JsonRequest -Method DELETE -Url "$functionsApiBase/cms-blog-delete" -Headers $deleteHeaders -Body $deletePayload -ExpectedStatusCodes @(200)
  if (-not $deleteRes.body.data.deleted) {
    throw "Delete endpoint no confirmo deleted=true."
  }

  $deletedPostRes = Invoke-JsonRequest -Method GET -Url "$supabaseUrl/rest/v1/blog_posts?id=eq.$postId&select=id&limit=1" -Headers $apiHeaders
  $deletedPost = Get-FirstRow $deletedPostRes.body
  if ($null -ne $deletedPost) {
    throw "El post sigue existiendo despues de delete."
  }

  $deleteLogRes = Invoke-JsonRequest -Method GET -Url "$supabaseUrl/rest/v1/cms_api_request_log?select=request_id,endpoint,status_code&request_id=eq.$requestIdDelete&limit=1" -Headers $apiHeaders
  $deleteLog = Get-FirstRow $deleteLogRes.body
  if ($null -eq $deleteLog) {
    throw "No se encontro log de delete en cms_api_request_log."
  }

  $deleteExecuted = $true
  Write-Step "Delete OK: post eliminado y log auditado."
}

$summary = [PSCustomObject]@{
  postId = $post.id
  status = $post.status
  slug = $post.slug
  categorySlug = $post.category_slug
  canonicalUrl = $post.canonical_url
  publishDate = $post.publish_date
  scheduledPublishAt = $post.scheduled_publish_at
  deleteExecuted = $deleteExecuted
  role = $role
  logsValidated = $logs.Count
}

Write-Host ""
Write-Host "Smoke test CMS completado correctamente." -ForegroundColor Green
$summary | Format-List
