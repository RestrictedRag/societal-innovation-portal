import test from 'node:test';
import assert from 'node:assert/strict';

import { MIN_DESCRIPTION_WORDS, DEFAULT_RADIUS_KM } from '@/lib/constants';
import { isDescriptionValid, getComplaintValidationError } from '@/lib/problem-validation';
import { redisKeys } from '@/lib/redisKeys';
import { buildNearbyProblemsGeoQuery } from '@/lib/geo-query';

test('description validation uses the shared minimum word count', () => {
  assert.equal(isDescriptionValid('one two three'), false);
  assert.equal(isDescriptionValid('one '.repeat(MIN_DESCRIPTION_WORDS).trim()), true);
});

test('complaint validation returns the same error shape before submission', () => {
  assert.equal(getComplaintValidationError('', 'one two three', null), 'Title is required.');
  assert.equal(getComplaintValidationError('Title', 'one two three', null), 'Description must be at least 30 words.');
  assert.equal(getComplaintValidationError('Title', 'one '.repeat(MIN_DESCRIPTION_WORDS).trim(), { lat: 12.5, lng: 77.5 }), null);
});

test('redis keys are centralized and stable', () => {
  assert.equal(redisKeys.problemProcessingQueue(), 'queue:problem-processing');
  assert.equal(redisKeys.rateLimitFor('user-123'), 'ratelimit:submit:user-123');
  assert.equal(redisKeys.notificationsFor('user-123'), 'pubsub:notifications:user-123');
});

test('geo query builder keeps the radius and distance fragments consistent', () => {
  const query = buildNearbyProblemsGeoQuery();
  assert.match(query.distanceFilter, /ST_DWithin/);
  assert.match(query.distanceExpression, /ST_Distance/);
  assert.equal(query.radiusReference, 'DEFAULT_RADIUS_KM');
  assert.equal(DEFAULT_RADIUS_KM, 25);
});
