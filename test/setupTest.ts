// Configuración de variables de entorno para los tests
process.env.PORT = '3003';
process.env.NATS_SERVERS = 'nats://localhost:4222';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.CRYPTO_KEY = 'test-crypto-key-for-testing';

// Mock de console para evitar logs innecesarios durante los tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
