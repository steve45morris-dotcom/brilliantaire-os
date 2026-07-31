import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecurityManager, timingSafeCompare } from './SecurityManager.js';
import { MCPAuth } from '../../integrations/openai/mcp/MCPAuth.js';

describe('Security Hardening & Authentication Verification Tests', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.ADMIN_SECRET_KEY = 'test-admin-secret-key-12345';
    process.env.OPERATOR_SECRET_KEY = 'test-operator-secret-key-67890';
    process.env.MCP_SECRET_KEY = 'test-mcp-secret-key-99999';
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('timingSafeCompare', () => {
    it('does not throw on mismatched-length inputs and returns false', () => {
      expect(() => {
        const result = timingSafeCompare('short', 'much-longer-string-to-compare');
        expect(result).toBe(false);
      }).not.toThrow();

      expect(timingSafeCompare('abc', 'abcd')).toBe(false);
      expect(timingSafeCompare('', 'something')).toBe(false);
      expect(timingSafeCompare(undefined, 'something')).toBe(false);
    });

    it('returns true on matching strings of equal length', () => {
      expect(timingSafeCompare('exact-match-token', 'exact-match-token')).toBe(true);
    });
  });

  describe('SecurityManager.authenticate()', () => {
    it('returns null when credential does not match ADMIN_SECRET_KEY / OPERATOR_SECRET_KEY', () => {
      const sm = new SecurityManager();
      const sessionAdmin = sm.authenticate('testuser', 'wrong-credential', 'Administrator');
      expect(sessionAdmin).toBeNull();

      const sessionOp = sm.authenticate('testuser', 'wrong-credential', 'Operator');
      expect(sessionOp).toBeNull();
    });

    it('returns valid session when credential matches ADMIN_SECRET_KEY / OPERATOR_SECRET_KEY', () => {
      const sm = new SecurityManager();
      const sessionAdmin = sm.authenticate('adminuser', 'test-admin-secret-key-12345', 'Administrator');
      expect(sessionAdmin).not.toBeNull();
      expect(sessionAdmin?.role).toBe('Administrator');

      const sessionOp = sm.authenticate('opuser', 'test-operator-secret-key-67890', 'Operator');
      expect(sessionOp).not.toBeNull();
      expect(sessionOp?.role).toBe('Operator');
    });

    it('authenticates Viewer role without requiring admin credential', () => {
      const sm = new SecurityManager();
      const sessionViewer = sm.authenticate('vieweruser', undefined, 'Viewer');
      expect(sessionViewer).not.toBeNull();
      expect(sessionViewer?.role).toBe('Viewer');
    });
  });

  describe('SecurityManager.checkPermission(action)', () => {
    it('evaluates per-action policies correctly', () => {
      const sm = new SecurityManager();
      sm.authenticate('opuser', 'test-operator-secret-key-67890', 'Operator');

      // Operator can execute operator:manage_tasks and mcp:issue_token
      expect(sm.checkPermission('mcp:issue_token')).toBe(true);
      expect(sm.checkPermission('operator:manage_tasks')).toBe(true);

      // Operator cannot execute admin:system_reset
      expect(sm.checkPermission('admin:system_reset')).toBe(false);
    });
  });

  describe('MCPAuth.issueToken()', () => {
    it('returns null with no session and no valid env secret', () => {
      const token = MCPAuth.issueToken('invalid-secret-or-token');
      expect(token).toBeNull();
    });

    it('mints a valid token when passed the valid MCP_SECRET_KEY secret', () => {
      const token = MCPAuth.issueToken('test-mcp-secret-key-99999');
      expect(token).not.toBeNull();
      expect(typeof token).toBe('string');
      expect(MCPAuth.isValidToken(token!)).toBe(true);
    });
  });
});
