import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { message: string }) {
    // Bạn có thể query DB lấy danh sách sản phẩm thực tế ở đây để truyền vào askStylist
    const products = [
      { name: 'Áo thun thể thao nam', price: '199k', color: 'Đen/Trắng' },
      { name: 'Quần kra chạy bộ', price: '250k', color: 'Xám' },
    ];

    const reply = await this.aiService.askStylist(body.message, products);
    return { reply };
  }
}
