import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';

describe('ThemeController', () => {
  let controller: ThemeController;
  let service: ThemeService;

  beforeEach(async () => {
    // Set NODE_ENV to test to use in-memory database
    process.env.NODE_ENV = 'test';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [ThemeService],
    }).compile();

    controller = module.get<ThemeController>(ThemeController);
    service = module.get<ThemeService>(ThemeService);

    // Manually trigger module init to initialize the database
    await service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should save and retrieve themes', async () => {
    const saved = await controller.saveTheme({
      name: 'Sunset Pink',
      gradient: 'linear-gradient(135deg, #FFB7B2, #FF9AA2)',
      noise: 0.15,
    });

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('Sunset Pink');
    expect(saved.gradient).toBe('linear-gradient(135deg, #FFB7B2, #FF9AA2)');
    expect(saved.noise).toBe(0.15);

    const themes = await controller.getThemes();
    expect(themes.length).toBe(1);
    expect(themes[0].name).toBe('Sunset Pink');
  });

  it('should support upsert on name conflict', async () => {
    await controller.saveTheme({
      name: 'Sunset Pink',
      gradient: 'linear-gradient(135deg, #FFB7B2, #FF9AA2)',
      noise: 0.15,
    });

    const updated = await controller.saveTheme({
      name: 'Sunset Pink',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8B3D)',
      noise: 0.3,
    });

    expect(updated.gradient).toBe('linear-gradient(135deg, #FF6B6B, #FF8B3D)');
    expect(updated.noise).toBe(0.3);

    const themes = await controller.getThemes();
    expect(themes.length).toBe(1);
  });
});
