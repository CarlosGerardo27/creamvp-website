// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createRequestId, isPreflightRequest, preflightResponse } from "../_shared/http.ts";
import { handleCreateBlogRequest } from "./handlers/create-blog-handler.ts";

serve(async (request) => {
  if (isPreflightRequest(request)) {
    return preflightResponse();
  }

  const requestId = createRequestId(request);
  return handleCreateBlogRequest(request, requestId);
});

