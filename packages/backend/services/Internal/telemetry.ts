import prisma from 'prisma/client';
import { TelemetryService } from '../../generated/typescript/api/resources/internal/resources/telemetry/service/TelemetryService';
import config from 'config';
import logger from 'helpers/logger';

const telemetryService = new TelemetryService({
    async createTelemetryEntry(req, res) {
        const telemetryData = req.body;
        if (config.DISABLE_REVERT_TELEMETRY) {
            logger.info('Telemetry has been disabled, not recording any stats');
        }
        // TODO: check for valid source/some kind of auth here.
        prisma.telemetry.create({
            data: {
                id: String(Date.now()),
                metadata: JSON.stringify(telemetryData),
            },
        });
    },
});

export { telemetryService };
