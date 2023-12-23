import dotenv from 'dotenv';

dotenv.config();
jest.setTimeout(12000000);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

