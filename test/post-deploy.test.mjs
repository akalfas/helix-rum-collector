/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
import { expect } from 'chai';
import * as chai from 'chai';
import chaiHttp from 'chai-http';

const { request } = chai.use(chaiHttp);

const domain = !process.env.CI ? 'rum.hlx3.page' : 'helix-rum-collector-ci.edgecompute.app';

console.log(`Using ${domain}`);

describe('Helix RUM Collector Post-Deploy Tests', () => {
  it('Missing body returns 400', async () => {
    const response = await request(`https://${domain}`)
      .post('/');
    expect(response).to.have.status(400);
  });

  it('RUM collection with masked timestamp (t) returns 201', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send({
        t: 1234,
        cwv: {
          CLS: 1.0,
          LCP: 1.0,
          FID: 4,
        },
        id: 'truncaty-me-timestampy-please',
        weight: 1,
      });
    expect(response).to.have.status(201);
  });

  it('RUM collection returns 201', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send({
        cwv: {
          CLS: 1.0,
          LCP: 1.0,
          FID: 4,
        },
        id: 'blablub',
        weight: 1,
      });
    expect(response).to.have.status(201);
  });

  it('RUM collection with empty string id returns 201', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send({
        cwv: {
          CLS: 1.0,
          LCP: 1.0,
          FID: 4,
        },
        id: '',
        weight: 1,
      });
    expect(response).to.have.status(201);
  });

  it('RUM collection via GET returns 201', async () => {
    const response = await request(`https://${domain}`)
      .get('/.rum/1?data=%7B%22checkpoint%22%3A%22noscript%22%2C%22weight%22%3A1%7D');
    expect(response).to.have.status(201);
  });

  it('CORS headers are set', async () => {
    const response = await request(`https://${domain}`)
      .options('/');
    expect(response).to.have.status(200);
    expect(response).to.have.header('access-control-allow-origin', '*');
  });

  it('robots.txt denies everything', async () => {
    const response = await request(`https://${domain}`)
      .get('/robots.txt');
    expect(response).to.have.status(200);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.be.text;
  });

  it('web vitals module is being served', async () => {
    const response = await request(`https://${domain}`)
      .get('/.rum/web-vitals@2.1.3/dist/web-vitals.base.js');
    expect(response).to.have.status(200);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.have.header('content-type', /^application\/javascript/);
  });

  it('web vitals module is being served without redirect', async () => {
    const response = await request(`https://${domain}`)
      .get('/.rum/web-vitals/dist/web-vitals.iife.js');
    expect(response).to.have.status(200);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.have.header('content-type', /^application\/javascript/);
  });

  it('rum js module is being served without redirect', async () => {
    const response = await request(`https://${domain}`)
      .get('/.rum/@adobe/helix-rum-js@^1/src/index.js');
    expect(response).to.have.status(200);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.have.header('content-type', /^application\/javascript/);
    // content length should be greater than 0
    expect(response).to.have.header('content-length', /^[1-9][0-9]*$/);
  }).timeout(5000);

  it.skip('rum js module is being served with default replacements', async () => {
    const response = await request(`https://${domain}`)
      .get('/.rum/@adobe/helix-rum-js@1.0.0/src/index.js')
      .buffer(true);
    expect(response).to.have.status(200);
    // eslint-disable-next-line no-unused-expressions
    expect(response).to.have.header('content-type', /^application\/javascript/);
    expect(response.text).to.contain('adobe-helix-rum-js-1.0.0');
  }).timeout(5000);

  it('Missing id returns 400', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send({
        cwv: {
          CLS: 1.0,
          LCP: 1.0,
          FID: 4,
        },
        weight: 1,
      });
    expect(response).to.have.status(400);
  });

  it('Non-numeric weight returns 400', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send({
        cwv: {
          CLS: 1.0,
          LCP: 1.0,
          FID: 4,
        },
        id: 'blablub',
        weight: 'one',
      });
    expect(response).to.have.status(400);
  });

  it('Non-object root returns 400', async () => {
    const response = await request(`https://${domain}`)
      .post('/')
      .send([]);
    expect(response).to.have.status(400);
  });
});
