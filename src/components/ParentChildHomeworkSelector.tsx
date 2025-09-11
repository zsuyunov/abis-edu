/*
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, Building } from 'lucide-react';

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  branchId: number;
  classId: number;
  academicYearId: number;
  branch: { name: string };
  class: { name: string };
}

interface ParentChildHomeworkSelectorProps {
  children: ChildInfo[];
  selectedChildId: string | null;
  onChildChange: (childId: string) => void;
}

const ParentChildHomeworkSelector: React.FC<ParentChildHomeworkSelectorProps> = ({
  children,
  selectedChildId,
  onChildChange,
}) => {
  const selectedChild = children.find(child => child.id === selectedChildId);

  if (children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Child Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No children assigned to this parent account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-6 w-6" />
          Child Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="child-select">Select Child</Label>
            <Select
              value={selectedChildId || ''}
              onValueChange={onChildChange}
            >
              <SelectTrigger id="child-select">
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedChild && (
            <div className="space-y-2">
              <Label>Child Information</Label>
              <div className="p-3 border rounded-md bg-gray-50 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Branch: </span>
                  <Badge variant="secondary">{selectedChild.branch.name}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Class: </span>
                  <Badge variant="secondary">{selectedChild.class.name}</Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {children.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Multi-Child Account:</strong> You have {children.length} children. 
              Use the selector above to switch between them and view their individual homework progress.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParentChildHomeworkSelector;

*/