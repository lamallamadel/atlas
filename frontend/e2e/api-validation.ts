import { Page, Route, Request } from '@playwright/test';
import { expect } from '@playwright/test';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface ApiValidationOptions {
  expectedStatus?: number;
  expectOrgId?: boolean;
  expectCorrelationId?: boolean;
  validateResponse?: (body: any) => void;
  errorScenario?: {
    expectedStatus: number;
    expectedProblemDetails?: Partial<ProblemDetails>;
    shouldDisplayMessage?: boolean;
  };
}

export interface RouteInterceptor {
  urlPattern: string | RegExp;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: (route: Route, request: Request) => Promise<void>;
}

/**
 * Validates that response headers include X-Org-Id and X-Correlation-Id
 */
export function validateResponseHeaders(headers: { [key: string]: string }, expectOrgId = true, expectCorrelationId = true): void {
  if (expectOrgId) {
    const orgIdHeader = headers['x-org-id'] || headers['X-Org-Id'];
    expect(orgIdHeader, 'Response should include X-Org-Id header').toBeTruthy();
  }
  
  if (expectCorrelationId) {
    const correlationIdHeader = headers['x-correlation-id'] || headers['X-Correlation-Id'];
    expect(correlationIdHeader, 'Response should include X-Correlation-Id header').toBeTruthy();
  }
}

/**
 * Validates that request headers include X-Org-Id and X-Correlation-Id
 */
export function validateRequestHeaders(request: Request, expectOrgId = true, expectCorrelationId = true): void {
  const headers = request.headers();
  
  if (expectOrgId) {
    const orgIdHeader = headers['x-org-id'] || headers['X-Org-Id'];
    expect(orgIdHeader, 'Request should include X-Org-Id header').toBeTruthy();
  }
  
  if (expectCorrelationId) {
    const correlationIdHeader = headers['x-correlation-id'] || headers['X-Correlation-Id'];
    expect(correlationIdHeader, 'Request should include X-Correlation-Id header').toBeTruthy();
  }
}

/**
 * Creates an API route interceptor with validation
 */
export async function interceptApiRoute(
  page: Page,
  urlPattern: string | RegExp,
  options: ApiValidationOptions = {}
): Promise<{ responses: any[], requests: Request[] }> {
  const responses: any[] = [];
  const requests: Request[] = [];

  await page.route(urlPattern, async (route: Route, request: Request) => {
    // Validate request headers
    if (options.expectOrgId !== false) {
      validateRequestHeaders(request, true, false);
    }
    if (options.expectCorrelationId !== false) {
      validateRequestHeaders(request, false, true);
    }

    // Continue with the actual request
    const response = await route.fetch();
    const responseBody = await response.text();
    let parsedBody: any = null;

    try {
      parsedBody = responseBody ? JSON.parse(responseBody) : null;
    } catch (e) {
      // Response is not JSON, keep as text
      parsedBody = responseBody;
    }

    // Validate response status
    if (options.expectedStatus !== undefined) {
      expect(response.status()).toBe(options.expectedStatus);
    }

    // Validate response headers
    const responseHeaders = response.headers();
    if (options.expectOrgId !== false) {
      validateResponseHeaders(responseHeaders, true, false);
    }
    if (options.expectCorrelationId !== false) {
      validateResponseHeaders(responseHeaders, false, true);
    }

    // Custom response validation
    if (options.validateResponse && parsedBody) {
      options.validateResponse(parsedBody);
    }

    // Error scenario validation
    if (options.errorScenario) {
      expect(response.status()).toBe(options.errorScenario.expectedStatus);
      
      if (options.errorScenario.expectedProblemDetails && parsedBody) {
        const problemDetails = parsedBody as ProblemDetails;
        
        if (options.errorScenario.expectedProblemDetails.status !== undefined) {
          expect(problemDetails.status).toBe(options.errorScenario.expectedProblemDetails.status);
        }
        
        if (options.errorScenario.expectedProblemDetails.title) {
          expect(problemDetails.title).toContain(options.errorScenario.expectedProblemDetails.title);
        }
        
        if (options.errorScenario.expectedProblemDetails.detail) {
          expect(problemDetails.detail).toContain(options.errorScenario.expectedProblemDetails.detail);
        }
        
        if (options.errorScenario.expectedProblemDetails.type) {
          expect(problemDetails.type).toBe(options.errorScenario.expectedProblemDetails.type);
        }
      }
    }

    // Store for later assertions
    requests.push(request);
    responses.push({ status: response.status(), body: parsedBody, headers: responseHeaders });

    // Fulfill with the actual response
    await route.fulfill({ response });
  });

  return { responses, requests };
}

/**
 * Validates ProblemDetails error response structure (RFC 7807)
 */
export function validateProblemDetails(problemDetails: any, expectedStatus?: number): void {
  expect(problemDetails, 'ProblemDetails object should exist').toBeTruthy();
  expect(problemDetails.status, 'ProblemDetails should include status code').toBeTruthy();
  
  if (expectedStatus !== undefined) {
    expect(problemDetails.status, `ProblemDetails status should be ${expectedStatus}`).toBe(expectedStatus);
  }
  
  // ProblemDetails should have at least title or detail
  const hasTitle = problemDetails.title && problemDetails.title.length > 0;
  const hasDetail = problemDetails.detail && problemDetails.detail.length > 0;
  expect(hasTitle || hasDetail, 'ProblemDetails should have title or detail').toBeTruthy();
  
  // Validate optional fields if present
  if (problemDetails.type !== undefined) {
    expect(typeof problemDetails.type, 'ProblemDetails type should be a string').toBe('string');
  }
  
  if (problemDetails.instance !== undefined) {
    expect(typeof problemDetails.instance, 'ProblemDetails instance should be a string').toBe('string');
  }
}

/**
 * Validates that a snackbar error message is displayed
 */
export async function validateErrorSnackbar(page: Page, expectedMessage?: string | RegExp): Promise<void> {
  const snackbar = page.locator('.mat-mdc-snack-bar-container, .snackbar, [role="alert"]');
  await expect(snackbar).toBeVisible({ timeout: 10000 });
  
  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      await expect(snackbar).toContainText(expectedMessage);
    } else {
      const text = await snackbar.textContent();
      expect(text).toMatch(expectedMessage);
    }
  }
}

/**
 * Validates DossierResponse structure
 */
export function validateDossierResponse(response: any): void {
  expect(response, 'DossierResponse should exist').toBeTruthy();
  expect(response.id, 'DossierResponse should include id').toBeTruthy();
  expect(response.orgId, 'DossierResponse should include orgId').toBeTruthy();
  expect(response.status, 'DossierResponse should include status').toBeTruthy();
  expect(response.createdAt, 'DossierResponse should include createdAt').toBeTruthy();
  expect(response.updatedAt, 'DossierResponse should include updatedAt').toBeTruthy();
}

/**
 * Validates MessageResponse structure
 */
export function validateMessageResponse(response: any): void {
  expect(response, 'MessageResponse should exist').toBeTruthy();
  expect(response.id, 'MessageResponse should include id').toBeTruthy();
  expect(response.orgId, 'MessageResponse should include orgId').toBeTruthy();
  expect(response.dossierId, 'MessageResponse should include dossierId').toBeTruthy();
  expect(response.channel, 'MessageResponse should include channel').toBeTruthy();
  expect(response.direction, 'MessageResponse should include direction').toBeTruthy();
  expect(response.content, 'MessageResponse should include content').toBeTruthy();
  expect(response.timestamp, 'MessageResponse should include timestamp').toBeTruthy();
  expect(response.createdAt, 'MessageResponse should include createdAt').toBeTruthy();
}

/**
 * Validates AppointmentResponse structure
 */
export function validateAppointmentResponse(response: any): void {
  expect(response, 'AppointmentResponse should exist').toBeTruthy();
  expect(response.id, 'AppointmentResponse should include id').toBeTruthy();
  expect(response.orgId, 'AppointmentResponse should include orgId').toBeTruthy();
  expect(response.dossierId, 'AppointmentResponse should include dossierId').toBeTruthy();
  expect(response.startTime, 'AppointmentResponse should include startTime').toBeTruthy();
  expect(response.endTime, 'AppointmentResponse should include endTime').toBeTruthy();
  expect(response.status, 'AppointmentResponse should include status').toBeTruthy();
  expect(response.createdAt, 'AppointmentResponse should include createdAt').toBeTruthy();
  expect(response.updatedAt, 'AppointmentResponse should include updatedAt').toBeTruthy();
}

/**
 * Validates AuditEventResponse structure
 */
export function validateAuditEventResponse(response: any): void {
  expect(response, 'AuditEventResponse should exist').toBeTruthy();
  expect(response.id, 'AuditEventResponse should include id').toBeTruthy();
  expect(response.orgId, 'AuditEventResponse should include orgId').toBeTruthy();
  expect(response.entityType, 'AuditEventResponse should include entityType').toBeTruthy();
  expect(response.entityId, 'AuditEventResponse should include entityId').toBeTruthy();
  expect(response.action, 'AuditEventResponse should include action').toBeTruthy();
  expect(response.createdAt, 'AuditEventResponse should include createdAt').toBeTruthy();
}

/**
 * Validates Page response structure (Spring Data Page)
 */
export function validatePageResponse(response: any, validateItem?: (item: any) => void): void {
  expect(response, 'Page response should exist').toBeTruthy();
  expect(response.content, 'Page response should include content array').toBeTruthy();
  expect(Array.isArray(response.content), 'Page content should be an array').toBeTruthy();
  expect(response.pageable, 'Page response should include pageable').toBeTruthy();
  expect(response.totalElements, 'Page response should include totalElements').toBeDefined();
  expect(response.totalPages, 'Page response should include totalPages').toBeDefined();
  expect(response.size, 'Page response should include size').toBeDefined();
  expect(response.number, 'Page response should include number').toBeDefined();
  
  if (validateItem && response.content.length > 0) {
    response.content.forEach((item: any, index: number) => {
      try {
        validateItem(item);
      } catch (error) {
        throw new Error(`Validation failed for item at index ${index}: ${error}`);
      }
    });
  }
}

/**
 * Creates multiple API route interceptors
 */
export async function setupApiInterceptors(
  page: Page,
  interceptors: RouteInterceptor[]
): Promise<void> {
  for (const interceptor of interceptors) {
    await page.route(interceptor.urlPattern, async (route: Route, request: Request) => {
      if (interceptor.method && request.method() !== interceptor.method) {
        await route.continue();
        return;
      }
      
      await interceptor.handler(route, request);
    });
  }
}

/**
 * Waits for an API call and validates it
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  options: ApiValidationOptions = {}
): Promise<{ request: Request, response: any }> {
  const promise = page.waitForResponse(
    response => {
      const url = response.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matches;
    },
    { timeout: 30000 }
  );

  const response = await promise;
  const request = response.request();

  // Validate request headers
  if (options.expectOrgId !== false || options.expectCorrelationId !== false) {
    validateRequestHeaders(request, options.expectOrgId !== false, options.expectCorrelationId !== false);
  }

  // Validate response status
  const status = response.status();
  if (options.expectedStatus !== undefined) {
    expect(status, `Expected status ${options.expectedStatus} but got ${status}`).toBe(options.expectedStatus);
  }

  // Validate response headers
  const responseHeaders = response.headers();
  if (options.expectOrgId !== false || options.expectCorrelationId !== false) {
    validateResponseHeaders(responseHeaders, options.expectOrgId !== false, options.expectCorrelationId !== false);
  }

  // Parse response body
  let parsedBody: any = null;
  try {
    parsedBody = await response.json();
  } catch (e) {
    parsedBody = await response.text();
  }

  // Custom response validation
  if (options.validateResponse && parsedBody) {
    options.validateResponse(parsedBody);
  }

  return { request, response: parsedBody };
}

/**
 * Mock error response using page.route()
 */
export async function mockErrorResponse(
  page: Page,
  urlPattern: string | RegExp,
  statusCode: number,
  problemDetails: ProblemDetails,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    if (route.request().method() === method) {
      await route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        headers: {
          'X-Org-Id': 'ORG-001',
          'X-Correlation-Id': `test-correlation-id-${statusCode}`
        },
        body: JSON.stringify(problemDetails)
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Validates that error response headers are present
 */
export function validateErrorResponseHeaders(headers: { [key: string]: string }): void {
  validateResponseHeaders(headers, true, true);
}

/**
 * Validates complete API error flow: response status, headers, ProblemDetails, and user message
 */
export async function validateApiError(
  page: Page,
  expectedStatus: number,
  expectedDetailPattern: string | RegExp,
  expectedUserMessage?: string | RegExp
): Promise<void> {
  // Wait for error response
  const errorResponse = await page.waitForResponse(
    response => response.status() === expectedStatus,
    { timeout: 10000 }
  );

  // Validate status code
  expect(errorResponse.status()).toBe(expectedStatus);

  // Validate headers
  validateErrorResponseHeaders(errorResponse.headers());

  // Validate ProblemDetails
  const errorBody = await errorResponse.json();
  validateProblemDetails(errorBody, expectedStatus);

  // Validate detail message
  if (typeof expectedDetailPattern === 'string') {
    expect(errorBody.detail).toContain(expectedDetailPattern);
  } else {
    expect(errorBody.detail).toMatch(expectedDetailPattern);
  }

  // Validate user-facing error message if provided
  if (expectedUserMessage) {
    await validateErrorSnackbar(page, expectedUserMessage);
  }
}
