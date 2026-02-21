import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const MAX_USERS = __ENV.MAX_USERS || 500;

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: MAX_USERS / 4 },
    { duration: '3m', target: MAX_USERS / 2 },
    { duration: '3m', target: (MAX_USERS * 3) / 4 },
    { duration: '2m', target: MAX_USERS },
    { duration: '10m', target: MAX_USERS },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<8000'],
    errors: ['rate<0.15'],
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const listAnnoncesResponse = http.get(
    `${BASE_URL}/api/v1/annonces?page=0&size=20`,
    { headers }
  );

  const success1 = check(listAnnoncesResponse, {
    'list annonces successful': (r) => r.status === 200,
  });
  errorRate.add(!success1);

  sleep(0.5);

  const dashboardResponse = http.get(
    `${BASE_URL}/api/v1/dashboard/summary`,
    { headers }
  );

  const success2 = check(dashboardResponse, {
    'dashboard successful': (r) => r.status === 200,
  });
  errorRate.add(!success2);
}
