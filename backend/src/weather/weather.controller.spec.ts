import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

describe('WeatherController', () => {
  let controller: WeatherController;
  const captureImageMock = jest.fn();
  const getWeatherMock = jest.fn();

  beforeEach(async () => {
    captureImageMock.mockReset();
    getWeatherMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: {
            getWeather: getWeatherMock,
            captureImage: captureImageMock,
          },
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call captureImage with custom gradient and noise parameters', async () => {
    const endMock = jest.fn();
    const mockRes = {
      end: endMock,
    } as unknown as Response;

    await controller.getWeatherImage(
      '94110',
      'current',
      'linear-gradient(...)',
      '0.5',
      mockRes,
    );

    expect(captureImageMock).toHaveBeenCalledWith(
      '94110',
      'current',
      'linear-gradient(...)',
      0.5,
    );

    expect(endMock).toHaveBeenCalled();
  });

  it('should call captureImage with default parameters when gradient and noise are omitted', async () => {
    const endMock = jest.fn();
    const mockRes = {
      end: endMock,
    } as unknown as Response;

    await controller.getWeatherImage(
      '94110',
      'current',
      undefined,
      undefined,
      mockRes,
    );

    expect(captureImageMock).toHaveBeenCalledWith(
      '94110',
      'current',
      undefined,
      undefined,
    );

    expect(endMock).toHaveBeenCalled();
  });
});
