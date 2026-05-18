import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ student_number: '', fullname: '', section: '', student_email: '', parent_email: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  const fetchStudents = async () => {
    try {
      const snap = await getDocs(collection(db, 'students'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'students'), formData);
      toast.success('Student added successfully');
      setOpen(false);
      fetchStudents();
      setFormData({ student_number: '', fullname: '', section: '', student_email: '', parent_email: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      toast.success('Deleted successfully');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const batch = writeBatch(db);
          let count = 0;
          results.data.forEach((row: any) => {
            // Adjust mapping as needed. We check for core fields.
            if (row.student_number && row.fullname && row.section && row.parent_email) {
              const docRef = doc(collection(db, 'students'));
              batch.set(docRef, {
                student_number: row.student_number,
                fullname: row.fullname,
                section: row.section,
                student_email: row.student_email || '',
                parent_email: row.parent_email
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
            toast.success(`Successfully uploaded ${count} students`);
            fetchStudents();
          } else {
            toast.error('No valid data found. Ensure CSV headers are: student_number, fullname, section, student_email, parent_email');
          }
        } catch (err: any) {
          toast.error(`Error uploading: ${err.message}`);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const sections = useMemo(() => {
    const unique = new Set(students.map(s => s.section).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    return students
      .filter(student => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          student.fullname?.toLowerCase().includes(query) ||
          student.student_number?.toLowerCase().includes(query) ||
          student.student_email?.toLowerCase().includes(query) ||
          student.parent_email?.toLowerCase().includes(query)
        );
        const matchesSection = filterSection === 'All' || student.section === filterSection;
        return matchesSearch && matchesSection;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc': return (a.fullname || '').localeCompare(b.fullname || '');
          case 'name-desc': return (b.fullname || '').localeCompare(a.fullname || '');
          case 'id-asc': return (a.student_number || '').localeCompare(b.student_number || '');
          case 'id-desc': return (b.student_number || '').localeCompare(a.student_number || '');
          default: return 0;
        }
      });
  }, [students, searchQuery, filterSection, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Student Management</h2>
        {user?.role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Bulk Upload CSV
              </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button />}>
                Add Student
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input required value={formData.student_number} onChange={e => setFormData({...formData, student_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input required value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Course/Section</Label>
                  <Input required value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Student Email (Optional)</Label>
                  <Input type="email" value={formData.student_email} onChange={e => setFormData({...formData, student_email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Parent Email (For Notifications)</Label>
                  <Input type="email" required value={formData.parent_email} onChange={e => setFormData({...formData, parent_email: e.target.value})} />
                </div>
                <Button type="submit" className="w-full">Save Student</Button>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-4">
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(sec => (
                <SelectItem key={sec} value={sec}>{sec === 'All' ? 'All Sections' : sec}</SelectItem>
              ))}
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Parent Email</TableHead>
              {user?.role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredAndSortedStudents.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found.</TableCell></TableRow>
            ) : (
              filteredAndSortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.student_number}</TableCell>
                  <TableCell>{student.fullname}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-500 ring-1 ring-inset ring-blue-500/20">
                      {student.section}
                    </span>
                  </TableCell>
                  <TableCell>{student.parent_email}</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)}>Delete</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
