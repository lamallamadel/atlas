import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 0 },
    { duration: '10s', target: 500 },
    { duration: '30s', target: 500 },
    { duration: '10s', target: 1000 },
    { duration: '30s', target: 1000 },
    { duration: '10s', target: 1500 },
    { duration: '30s', target: 1500 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    errors: ['rate<0.1'],
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

  sleep(0.1);

  const listDossiersResponse = http.get(
    `${BASE_URL}/api/v1/dossiers?page=0&size=20`,
    { headers }
  );

  const success2 = check(listDossiersResponse, {
    'list dossiers successful': (r) => r.status === 200,
  });
  errorRate.add(!success2);
}
