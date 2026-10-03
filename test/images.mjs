import { serializeChatRequest, serializeResponsesRequest } from '../lib/wire.js';

const png = 'AAAA';
const images = new Map([['sha256:abc', { mediaType: 'image/png', base64: png }]]);
const user = {
  model: 'grok-4.7',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'what color?' },
      {
        type: 'image',
        attachment: { attachmentId: 'sha256:abc', mediaType: 'image/png', bytes: 4, width: 32, height: 16 },
      },
    ],
  }],
};

const body = serializeResponsesRequest(user, {}, images);
const content = body.input[0].content;
if (content[0]?.type !== 'input_text' || content[0].text !== 'what color?') {
  throw new Error('text part was not preserved');
}
if (content[1]?.type !== 'input_image' || content[1].image_url !== 'data:image/png;base64,AAAA') {
  throw new Error(`expected input_image data URL, got ${JSON.stringify(content[1])}`);
}
const encoded = JSON.stringify(body);
if (encoded.includes('accepts text only') || encoded.includes('image attachment omitted')) {
  throw new Error('image was replaced with an omission placeholder');
}

let refused = false;
try {
  serializeChatRequest(user, {}, images);
} catch (error) {
  refused = /Responses API/.test(error?.message ?? '');
}
if (!refused) throw new Error('chat dialect must refuse retained images');

const offloaded = serializeResponsesRequest({
  model: 'grok-4.7',
  messages: [{
    role: 'user',
    content: [{
      type: 'image',
      offloaded: true,
      attachment: { attachmentId: 'sha256:fff', mediaType: 'image/png', bytes: 1, width: 32, height: 32 },
    }],
  }],
}, {}, new Map());
const placeholder = offloaded.input[0].content[0];
if (placeholder?.type !== 'input_text' || !placeholder.text.includes('image omitted to fit request image limits')) {
  throw new Error('offloaded image was not turned into a text placeholder');
}

const tool = serializeResponsesRequest({
  model: 'grok-4.7',
  messages: [{
    role: 'tool',
    content: [{
      type: 'tool-result',
      toolCallId: 'call_1',
      content: [
        { type: 'text', text: 'see' },
        { type: 'image', attachment: { attachmentId: 'sha256:abc', mediaType: 'image/png', bytes: 4, width: 32, height: 16 } },
      ],
    }],
  }],
}, {}, images);
const output = tool.input[0].output;
if (!Array.isArray(output) || output[1]?.type !== 'input_image') {
  throw new Error('tool image was not serialized as input_image parts');
}

console.log('image wire ok');
