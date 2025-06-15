
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const DisplayTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
        <CardDescription>
          Customize how your calendar appears
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default View</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Timeline</Button>
            <Button variant="outline" size="sm">Week View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisplayTab;
