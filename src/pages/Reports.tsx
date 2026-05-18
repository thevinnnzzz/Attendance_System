import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    section: '',
    status: ''
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Create conditions
      const conditionParts: any[] = [];
      if (filters.startDate) conditionParts.push(where('date', '>=', filters.startDate));
      if (filters.endDate) conditionParts.push(where('date', '<=', filters.endDate));
      if (filters.status) conditionParts.push(where('status', '==', filters.status));

      const attQuery = query(collection(db, 'attendance'), ...conditionParts);
      const attSnap = await getDocs(attQuery);
      let attList = attSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      // we need student details
      const studentSnap = await getDocs(collection(db, 'students'));
      const studentMap = new Map();
      studentSnap.docs.forEach(doc => {
        studentMap.set(doc.id, doc.data());
      });

      let results = attList.map(item => {
        const student = studentMap.get(item.student_id);
        return {
          ...item,
          student_number: student?.student_number,
          fullname: student?.fullname,
          section: student?.section,
        };
      }).filter(item => {
        if (filters.section && item.section !== filters.section) return false;
        return true;
      });

      // Sort desc by date
      results.sort((a: any, b: any) => b.date.localeCompare(a.date));

      setRecords(results);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportCSV = () => {
    if (records.length === 0) return toast.warning('No data to export');
    
    const headers = ['Date', 'Student ID', 'Name', 'Section', 'Status'];
    const rows = records.map(r => [
      r.date, 
      r.student_number, 
      `"${r.fullname}"`, 
      r.section, 
      r.status
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Attendance Reports</h2>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="bg-card p-4 border rounded-lg flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Start Date</label>
          <Input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">End Date</label>
          <Input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Section</label>
          <Input placeholder="Filter by section..." value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Input placeholder="Present/Absent/Late" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} />
        </div>
        <Button onClick={fetchReports} className="gap-2">
          <Filter size={16} /> Filter
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendance records found for this period.</TableCell></TableRow>
            ) : (
              records.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-medium">{r.student_number}</TableCell>
                  <TableCell>{r.fullname}</TableCell>
                  <TableCell>{r.section}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
