import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../lib/api-config';

export default function Attendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [confirmModalState, setConfirmModalState] = useState<{ open: boolean; student: any; status: string }>({ open: false, student: null, status: '' });
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [bulkConfirmModalState, setBulkConfirmModalState] = useState<{ open: boolean; status: string }>({ open: false, status: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: studentList, error: studentError } = await supabase.from('students').select('*');
      if (studentError) throw studentError;

      const { data: attList, error: attError } = await supabase.from('attendance').select('*').eq('date', date);
      if (attError) throw attError;

      setStudents(studentList || []);
      setAttendanceRecords(attList || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredAndSortedStudents.length && filteredAndSortedStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredAndSortedStudents.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    const newPaths = new Set(selectedStudentIds);
    if (newPaths.has(studentId)) {
      newPaths.delete(studentId);
    } else {
      newPaths.add(studentId);
    }
    setSelectedStudentIds(newPaths);
  };

  const handleBulkStatusChange = (status: string) => {
    if (selectedStudentIds.size === 0) {
      toast.info('No students selected');
      return;
    }
    if (status === 'Absent' || status === 'Late') {
      setBulkConfirmModalState({ open: true, status });
    } else {
      executeBulkMark(status);
    }
  };

  const executeBulkMark = async (status: string) => {
    const selectedStudents = filteredAndSortedStudents.filter(s => selectedStudentIds.has(s.id));
    const toastId = toast.loading(`Marking ${selectedStudents.length} students as ${status}...`);
    try {
      for (const student of selectedStudents) {
        const existing = attendanceRecords.find(r => r.student_id === student.id);
        if (existing) {
          if (existing.status !== status) {
            const { error } = await supabase.from('attendance').update({ status, recorded_by: user?.id }).eq('id', existing.id);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase.from('attendance').insert({
            student_id: student.id,
            status,
            date,
            recorded_by: user?.id,
          });
          if (error) throw error;
        }

        if ((status === 'Absent' || status === 'Late') && student.parent_email) {
          fetch(`${API_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: student.fullname,
              parentEmail: student.parent_email,
              status,
              date
            })
          }).catch(err => console.error("Failed to trigger email:", err));
        }
      }
      toast.success(`Successfully marked ${selectedStudents.length} students as ${status}`, { id: toastId });
      setSelectedStudentIds(new Set());
      fetchData();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  const handleStatusChange = (student: any, status: string) => {
    if (status === 'Absent' || status === 'Late') {
      setConfirmModalState({ open: true, student, status });
    } else {
      markAttendance(student, status);
    }
  };

  const markAttendance = async (student: any, status: string) => {
    try {
      const existing = attendanceRecords.find(r => r.student_id === student.id);

      if (existing) {
        if (existing.status !== status) {
          const { error } = await supabase.from('attendance').update({
            status,
            recorded_by: user?.id,
          }).eq('id', existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('attendance').insert({
          student_id: student.id,
          status,
          date,
          recorded_by: user?.id,
        });
        if (error) throw error;
      }

      if ((status === 'Absent' || status === 'Late') && student.parent_email) {
        fetch(`${API_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: student.fullname,
            parentEmail: student.parent_email,
            status,
            date
          })
        }).catch(err => console.error("Failed to trigger email:", err));
      }

      toast.success(`Marked ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatus = (studentId: string) => {
    return attendanceRecords.find(r => r.student_id === studentId)?.status;
  };

  const filteredAndSortedStudents = useMemo(() => {
    return students
      .filter(student => {
        const queryStr = searchQuery.toLowerCase();
        const matchesSearch = (
          student.fullname?.toLowerCase().includes(queryStr) ||
          student.student_number?.toLowerCase().includes(queryStr) ||
          student.section?.toLowerCase().includes(queryStr)
        );

        const status = getStatus(student.id) || 'Unmarked';
        const matchesStatus = filterStatus === 'All' || status === filterStatus;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = sortBy === 'name-asc' || sortBy === 'name-desc' ? a.fullname :
                     sortBy === 'id-asc' || sortBy === 'id-desc' ? a.student_number :
                     getStatus(a.id) || 'Unmarked';

        const valB = sortBy === 'name-asc' || sortBy === 'name-desc' ? b.fullname :
                     sortBy === 'id-asc' || sortBy === 'id-desc' ? b.student_number :
                     getStatus(b.id) || 'Unmarked';

        if (sortBy.endsWith('-asc')) {
          return (valA || '').localeCompare(valB || '');
        } else {
          return (valB || '').localeCompare(valA || '');
        }
      });
  }, [students, attendanceRecords, searchQuery, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Attendance Logging</h2>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or section..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Unmarked">Unmarked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="id-asc">Student ID (A-Z)</SelectItem>
              <SelectItem value="id-desc">Student ID (Z-A)</SelectItem>
              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
              <SelectItem value="status-desc">Status (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={confirmModalState.open} onOpenChange={(open) => !open && setConfirmModalState({ open: false, student: null, status: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Attendance Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark <strong>{confirmModalState.student?.fullname}</strong> as <strong>{confirmModalState.status}</strong>?
              This action will trigger an email notification to the parent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalState({ open: false, student: null, status: '' })}>Cancel</Button>
            <Button onClick={() => {
              if (confirmModalState.student && confirmModalState.status) {
                markAttendance(confirmModalState.student, confirmModalState.status);
              }
              setConfirmModalState({ open: false, student: null, status: '' });
            }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkConfirmModalState.open} onOpenChange={(open) => !open && setBulkConfirmModalState({ open: false, status: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Status Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark <strong>{selectedStudentIds.size}</strong> selected students as <strong>{bulkConfirmModalState.status}</strong>?
              This action may trigger email notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmModalState({ open: false, status: '' })}>Cancel</Button>
            <Button onClick={() => {
              if (bulkConfirmModalState.status) {
                executeBulkMark(bulkConfirmModalState.status);
              }
              setBulkConfirmModalState({ open: false, status: '' });
            }}>Confirm Bulk Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg bg-card overflow-x-auto shadow-sm">
        {selectedStudentIds.size > 0 && (
          <div className="p-3 bg-blue-500/10 border-b flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-500 font-medium">
              {selectedStudentIds.size} student(s) selected
            </span>
            <Select onValueChange={(val) => handleBulkStatusChange(val)} value="">
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Mark Selected As..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent (Emails parent)</SelectItem>
                <SelectItem value="Late">Late (Emails parent)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={filteredAndSortedStudents.length > 0 && selectedStudentIds.size === filteredAndSortedStudents.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Mark Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredAndSortedStudents.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found.</TableCell></TableRow>
            ) : (
              filteredAndSortedStudents.map((student) => {
                const status = getStatus(student.id);
                return (
                  <TableRow key={student.id} className={selectedStudentIds.has(student.id) ? 'bg-blue-500/10' : ''}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.student_number}</TableCell>
                    <TableCell>{student.fullname}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-500 ring-1 ring-inset ring-blue-500/20">
                        {student.section}
                      </span>
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <Badge variant={status === 'Present' ? 'default' : status === 'Absent' ? 'destructive' : 'secondary'}>
                          {status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">Not marked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={status || ''} onValueChange={(val) => handleStatusChange(student, val)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Mark as..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent (Emails parent)</SelectItem>
                          <SelectItem value="Late">Late (Emails parent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
