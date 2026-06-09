import { describe, it, expect } from 'vitest';
import { formatAuthError } from '../utils/authErrors.ts';

describe('formatAuthError', () => {
  it('maps auth/email-already-in-use to friendly message', () => {
    const err = { code: 'auth/email-already-in-use', message: 'Firebase: Error (auth/email-already-in-use).' };
    expect(formatAuthError(err)).toBe('This email address is already in use. Please sign in instead, or use a different email.');
  });

  it('maps auth/invalid-email to friendly message', () => {
    expect(formatAuthError({ code: 'auth/invalid-email' })).toBe('Please enter a valid email address.');
  });

  it('maps auth/weak-password to friendly message', () => {
    expect(formatAuthError({ code: 'auth/weak-password' })).toBe('Your password is too weak. Please use at least 6 characters.');
  });

  it('maps auth/user-disabled to friendly message', () => {
    expect(formatAuthError({ code: 'auth/user-disabled' })).toBe('This user account has been disabled. Please contact support.');
  });

  it('maps auth/user-not-found to credential error', () => {
    expect(formatAuthError({ code: 'auth/user-not-found' })).toBe('Invalid email address or password. Please check your credentials and try again.');
  });

  it('maps auth/wrong-password to credential error', () => {
    expect(formatAuthError({ code: 'auth/wrong-password' })).toBe('Invalid email address or password. Please check your credentials and try again.');
  });

  it('maps auth/invalid-credential to credential error', () => {
    expect(formatAuthError({ code: 'auth/invalid-credential' })).toBe('Invalid email address or password. Please check your credentials and try again.');
  });

  it('maps auth/too-many-requests to rate limit message', () => {
    expect(formatAuthError({ code: 'auth/too-many-requests' })).toBe('Too many failed sign-in attempts. Please wait a moment and try again, or reset your password.');
  });

  it('maps auth/network-request-failed to network message', () => {
    expect(formatAuthError({ code: 'auth/network-request-failed' })).toBe('Network connection failed. Please check your internet connection and try again.');
  });

  it('maps auth/operation-not-allowed to configuration message', () => {
    expect(formatAuthError({ code: 'auth/operation-not-allowed' })).toBe('Email/Password authentication is not enabled in the Firebase Console.');
  });

  it('extracts code from raw message when code property is missing', () => {
    const err = { message: 'Firebase: Error (auth/email-already-in-use).' };
    expect(formatAuthError(err)).toBe('This email address is already in use. Please sign in instead, or use a different email.');
  });

  it('strips Firebase prefix from unknown error messages', () => {
    const err = { message: 'Firebase: Something unexpected happened.' };
    expect(formatAuthError(err)).toBe('Something unexpected happened.');
  });

  it('returns generic message for null input', () => {
    expect(formatAuthError(null)).toBe('Authentication failed. Please verify your credentials and try again.');
  });

  it('returns generic message for undefined input', () => {
    expect(formatAuthError(undefined)).toBe('Authentication failed. Please verify your credentials and try again.');
  });

  it('handles string error input', () => {
    expect(formatAuthError('some error string')).toBe('some error string');
  });

  it('handles Error object input', () => {
    expect(formatAuthError(new Error('Something went wrong'))).toBe('Something went wrong');
  });

  it('returns generic message for empty object', () => {
    expect(formatAuthError({})).toBe('Authentication failed. Please verify your credentials and try again.');
  });
});
