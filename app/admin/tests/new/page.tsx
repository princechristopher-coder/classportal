import { Card } from '@/components/ui/index';
import TestForm from '@/components/tests/TestForm';

export default function NewTestPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">New Test</h1>
        <p className="text-sm text-white/50">Set the rules first, then add questions on the next screen.</p>
      </div>
      <Card>
        <TestForm mode="create" />
      </Card>
    </div>
  );
}
