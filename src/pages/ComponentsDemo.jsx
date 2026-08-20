import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Modal,
  Spinner,
  Rating,
  Toast,
  ProductCard,
} from '../components/ui';

const MOCK_PRODUCT = {
  _id: 'demo-1',
  slug: 'demo-product',
  title: 'Ethiopian Honey 500g',
  basePrice: 450,
  images: [],
  rating: 4.3,
  reviewCount: 89,
  vendorName: 'Addis Organics',
};

export default function ComponentsDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toastShow, setToastShow] = useState(false);

  const showToast = () => {
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2500);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-extrabold">Components demo</h1>

      {/* Button / Input / Select / Badge / Rating / Spinner */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">
          Button · Input · Select · Badge · Rating · Spinner
        </p>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="gold">Gold</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Input" placeholder="Type here" />
          <Select label="Select">
            <option>One</option>
            <option>Two</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="forest">Active</Badge>
          <Badge tone="gold">Growth</Badge>
          <Badge tone="crimson">-30%</Badge>
          <Badge tone="gray">Draft</Badge>
          <Rating value={4.5} count={128} />
          <Rating value={3} />
          <Spinner />
        </div>
      </Card>

      {/* Modal */}
      <Card className="p-5 space-y-3">
        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Modal</p>
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm action">
          <p className="text-ink/70 text-sm">
            This is the modal body. Click Confirm or press the backdrop to close.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </Card>

      {/* Toast */}
      <Card className="p-5 space-y-3">
        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Toast</p>
        <Button variant="secondary" onClick={showToast}>
          Show toast
        </Button>
      </Card>
      <Toast show={toastShow}>Item added to cart</Toast>

      {/* ProductCard */}
      <Card className="p-5 space-y-3">
        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">
          ProductCard — image fallback (no image)
        </p>
        <div className="max-w-[200px]">
          <ProductCard product={MOCK_PRODUCT} onAdd={showToast} />
        </div>
      </Card>
    </section>
  );
}
