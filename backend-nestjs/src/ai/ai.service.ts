import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

@Injectable()
export class AiService {
  private readonly client: BedrockRuntimeClient;

  constructor(private readonly config: ConfigService) {
    this.client = new BedrockRuntimeClient({
      region:
        this.config.get<string>('AWS_BEDROCK_REGION') ||
        this.config.get<string>('AWS_REGION') ||
        'us-east-1',
    });
  }

  async askStylist(userMessage: string, productList: any[] = []) {
    const systemPrompt = `Bạn là trợ lý tư vấn thời trang cho shop quần áo.
Danh sách sản phẩm hiện có trong shop: ${JSON.stringify(productList)}.
Hãy tư vấn ngắn gọn, lịch sự, đúng trọng tâm và gợi ý sản phẩm phù hợp dựa trên yêu cầu khách hàng.`;

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\nKhách hàng hỏi: ${userMessage}`,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId:
        this.config.get<string>('AWS_BEDROCK_MODEL_ID') ||
        'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.content[0].text;
  }
}
