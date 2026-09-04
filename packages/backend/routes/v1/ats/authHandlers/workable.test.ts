import { describe, expect, it } from '@jest/globals';
import { TP_ID } from '@prisma/client';
import { DEFAULT_SCOPE, mapIntegrationIdToIntegrationName } from '../../../../constants/common';
import workableAuthHandler from './workable';

describe('Workable ATS Integration', () => {
    it('should have Workable registered in mapIntegrationIdToIntegrationName', () => {
        expect(mapIntegrationIdToIntegrationName[TP_ID.workable]).toBe('Workable');
    });

    it('should have default scopes defined for Workable', () => {
        expect(DEFAULT_SCOPE[TP_ID.workable]).toBeDefined();
        expect(Array.isArray(DEFAULT_SCOPE[TP_ID.workable])).toBe(true);
    });

    it('should export an instance of WorkableAuthHandler', () => {
        expect(workableAuthHandler).toBeDefined();
        expect(typeof workableAuthHandler.handleBasicAuth).toBe('function');
        expect(typeof workableAuthHandler.handleOAuth).toBe('function');
    });
});
