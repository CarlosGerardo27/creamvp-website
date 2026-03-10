// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createRequestId, isPreflightRequest, preflightResponse } from "../_shared/http.ts";
import { handleDeleteBlogRequest } from "./handlers/delete-blog-handler.ts";

serve(async (request) => {
  if (isPreflightRequest(request)) {
    return preflightResponse();
  }

  const requestId = createRequestId(request);
  return handleDeleteBlogRequest(request, requestId);
});

