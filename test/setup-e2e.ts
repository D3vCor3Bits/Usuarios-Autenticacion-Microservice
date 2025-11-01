// Setup para pruebas E2E
// Variables de entorno para testing

process.env.PORT = '3001';
process.env.NATS_SERVERS = 'nats://localhost:4222';

// Supabase (estos valores serán mockeados en los tests)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-supabase-key';
