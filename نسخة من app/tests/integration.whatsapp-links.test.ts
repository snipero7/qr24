import { describe, it, expect } from 'vitest';
import { templates } from '@/config/notifications';
import { buildWhatsAppLink } from '@/lib/whatsapp';

describe('Integration: WhatsApp links', () => {
  const phone = '0550000000';

  it('READY order link uses order.ready template', () => {
    const url = buildWhatsAppLink(phone, templates['order.ready'], { customerName: 'عميل', orderCode: 'ready12345', service: 'اختبار', storeAddress: 'العنوان' });
    expect(url).toContain('https://wa.me/');
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('جاهز للاستلام');
    expect(text).toContain('ready12345');
  });

  it('DELIVERED order link uses order.delivered template', () => {
    const url = buildWhatsAppLink(phone, templates['order.delivered'], { customerName: 'عميل', collectedPrice: 120, receiptUrl: 'http://x/y.pdf', storeName: 'متجري' });
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('تم تسليم');
    expect(text).toContain('120');
    expect(text).toContain('http://x/y.pdf');
  });

  it('Debt reminder includes remaining value', () => {
    const url = buildWhatsAppLink(phone, templates['debt.reminder'], { shopName: 'محل', remaining: 50, service: 'صيانة' });
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('50');
  });
});

