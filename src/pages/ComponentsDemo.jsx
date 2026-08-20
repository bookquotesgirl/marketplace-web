import { Button, Input, Select, Badge, Card, Spinner, Rating } from '../components/ui';
export default function ComponentsDemo() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-extrabold">Components demo</h1>
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="gold">Gold</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Input" placeholder="Type here" />
          <Select label="Select">
            <option>One</option>
            <option>Two</option>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="forest">Active</Badge>
          <Badge tone="gold">Growth</Badge>
          <Badge tone="crimson">-30%</Badge>
          <Rating value={4.5} count={128} />
          <Spinner />
        </div>
      </Card>
    </section>
  );
}
