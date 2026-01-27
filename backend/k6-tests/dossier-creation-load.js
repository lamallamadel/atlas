import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const CONCURRENT_USERS = __ENV.CONCURRENT_USERS || 100;
const DURATION = __ENV.DURATION || '60m';

const errorRate = new Rate('errors');
const annonceCreationDuration = new Trend('annonce_creation_duration');
const dossierCreationDuration = new Trend('dossier_creation_duration');
const dossierCreationCount = new Counter('dossiers_created');

export const options = {
  stages: [
    { duration: '5m', target: CONCURRENT_USERS / 2 },
    { duration: '5m', target: CONCURRENT_USERS },
    { duration: DURATION, target: CONCURRENT_USERS },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.05'],
    'http_req_duration{scenario:create_annonce}': ['p(95)<500'],
    'http_req_duration{scenario:create_dossier}': ['p(95)<700'],
  },
};

const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'];
const types = ['SALE', 'RENT'];

function randomCity() {
  return cities[Math.floor(Math.random() * cities.length)];
}

function randomType() {
  return types[Math.floor(Math.random() * types.length)];
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const annoncePayload = JSON.stringify({
    title: `Property ${generateUUID().substring(0, 8)}`,
    description: 'Beautiful property in excellent condition with modern amenities',
    type: randomType(),
    city: randomCity(),
    price: 200000 + Math.floor(Math.random() * 500000),
    surface: 50 + Math.floor(Math.random() * 150),
    status: 'ACTIVE',
  });

  const createAnnonceStart = Date.now();
  const annonceResponse = http.post(
    `${BASE_URL}/api/v1/annonces`,
    annoncePayload,
    { headers, tags: { scenario: 'create_annonce' } }
  );
  
  const annonceSuccess = check(annonceResponse, {
    'annonce created successfully': (r) => r.status === 201,
    'annonce has id': (r) => r.json('id') !== undefined,
  });
  
  errorRate.add(!annonceSuccess);
  annonceCreationDuration.add(Date.now() - createAnnonceStart);

  if (!annonceSuccess) {
    console.error(`Failed to create annonce: ${annonceResponse.status} - ${annonceResponse.body}`);
    return;
  }

  const annonceId = annonceResponse.json('id');
  sleep(1 + Math.random() * 2);

  const dossierPayload = JSON.stringify({
    annonceId: annonceId,
    leadName: `Lead ${generateUUID().substring(0, 8)}`,
    leadEmail: `lead${Math.floor(Math.random() * 100000)}@example.com`,
    leadPhone: `+336${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    status: 'NEW',
    source: 'WEB',
  });

  const createDossierStart = Date.now();
  const dossierResponse = http.post(
    `${BASE_URL}/api/v1/dossiers`,
    dossierPayload,
    { headers, tags: { scenario: 'create_dossier' } }
  );

  const dossierSuccess = check(dossierResponse, {
    'dossier created successfully': (r) => r.status === 201,
    'dossier has id': (r) => r.json('id') !== undefined,
  });

  errorRate.add(!dossierSuccess);
  dossierCreationDuration.add(Date.now() - createDossierStart);

  if (dossierSuccess) {
    dossierCreationCount.add(1);
  } else {
    console.error(`Failed to create dossier: ${dossierResponse.status} - ${dossierResponse.body}`);
    return;
  }

  const dossierId = dossierResponse.json('id');
  sleep(0.5 + Math.random() * 1.5);

  const getDossierResponse = http.get(
    `${BASE_URL}/api/v1/dossiers/${dossierId}`,
    { headers, tags: { scenario: 'get_dossier' } }
  );

  check(getDossierResponse, {
    'dossier retrieved successfully': (r) => r.status === 200,
  });

  sleep(0.5 + Math.random());

  const updateStatusPayload = JSON.stringify({
    status: 'QUALIFIED',
  });

  const updateResponse = http.patch(
    `${BASE_URL}/api/v1/dossiers/${dossierId}/status`,
    updateStatusPayload,
    { headers, tags: { scenario: 'update_status' } }
  );

  check(updateResponse, {
    'status updated successfully': (r) => r.status === 200 || r.status === 204,
  });
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n' + indent + '═════════════════════════════════════════════\n';
  summary += indent + '  K6 Load Test Summary - Dossier Creation\n';
  summary += indent + '═════════════════════════════════════════════\n\n';

  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += indent + `Dossiers Created: ${data.metrics.dossiers_created.values.count}\n\n`;

  summary += indent + 'Response Times:\n';
  summary += indent + `  p(50): ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += indent + `  p(75): ${data.metrics.http_req_duration.values['p(75)'].toFixed(2)}ms\n`;
  summary += indent + `  p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  summary += indent + 'Error Rate:\n';
  summary += indent + `  ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  summary += indent + 'Virtual Users:\n';
  summary += indent + `  Peak: ${data.metrics.vus_max.values.value}\n`;
  summary += indent + `  Avg: ${data.metrics.vus.values.value.toFixed(2)}\n\n`;

  summary += indent + '═════════════════════════════════════════════\n';
  
  return summary;
}
