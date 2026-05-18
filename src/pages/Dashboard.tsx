import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    totalSessions: 0
  });
  const [trendData, setTrendData] = useState<{name: string, present: number, absent: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const studentSnap = await getDocs(collection(db, 'students'));
        const totalStudents = studentSnap.size;
        
        // Setup cache for student names
        const studentMap = new Map();
        studentSnap.docs.forEach(doc => {
          const data = doc.data();
          studentMap.set(doc.id, {
            name: data.fullname || data.student_number,
            studentNumber: data.student_number || 'N/A'
          });
        });

        const attSnap = await getDocs(collection(db, 'attendance'));
        
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        // Group by date for trends
        const trends = new Map();
        
        // Sort docs manually just in case
        const sortedDocs = attSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .sort((a, b) => b.created_at - a.created_at); // desc by created_at

        sortedDocs.forEach(data => {
          if (data.date === selectedDate) {
            if (data.status === 'Present') presentCount++;
            if (data.status === 'Absent') absentCount++;
            if (data.status === 'Late') lateCount++;
          }

          if (data.date) {
            if (!trends.has(data.date)) {
              trends.set(data.date, { present: 0, absent: 0 });
            }
            if (data.status === 'Present') trends.get(data.date).present++;
            if (data.status === 'Absent') trends.get(data.date).absent++;
          }
        });

        setStats({ 
          totalStudents, 
          presentCount, 
          absentCount, 
          lateCount,
          totalSessions: sortedDocs.length
        });

        // Prepare Trend Data (last 7 days sorted by date)
        const sortedDates = Array.from(trends.keys()).sort();
        const last7Dates = sortedDates.slice(-7);
        const mappedTrends = last7Dates.map(date => {
           // just take MM-DD format
           const shortDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
           return {
             name: shortDate,
             present: trends.get(date).present,
             absent: trends.get(date).absent
           }
        });
        setTrendData(mappedTrends);

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [selectedDate]);

  const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#64748b']; // Electric Blue, Indigo, Mint Green, Slate Gray

  const trafficData = [
    { name: 'Present', value: stats.presentCount },
    { name: 'Absent', value: stats.absentCount },
    { name: 'Late', value: stats.lateCount },
  ].filter(d => d.value > 0);
  
  if (trafficData.length === 0) {
     trafficData.push({ name: 'No Data Yet', value: 1 });
  }

  return (
    <div className="space-y-8 pb-8 max-w-7xl mx-auto">
      {/* Top Bar Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor your key performance indicators and growth metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-background text-foreground text-sm"
          />
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Students', value: loading ? '...' : stats.totalStudents, change: 'Enrolled', isUp: true, color: '#0ea5e9' },
          { title: 'Present', value: loading ? '...' : stats.presentCount, change: 'Selected Date', isUp: true, color: '#10b981' },
          { title: 'Absent', value: loading ? '...' : stats.absentCount, change: 'Selected Date', isUp: false, color: '#6366f1' },
          { title: 'Late', value: loading ? '...' : stats.lateCount, change: 'Selected Date', isUp: false, color: '#f59e0b' },
        ].map((kpi, index) => (
          <Card key={index} className="shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                  kpi.isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-muted text-muted-foreground'
                }`}>
                  {kpi.isUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  {kpi.change}
                </div>
              </div>
              <div className="h-[40px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.from({ length: 15 }, () => ({ value: Math.floor(Math.random() * ((typeof kpi.value === 'number') ? kpi.value + 1 : 10) ) }))}>
                    <Line type="monotone" dataKey="value" stroke={kpi.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualizations Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <Card className="lg:col-span-2 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Weekly Attendance Trend</CardTitle>
              <p className="text-sm text-muted-foreground font-normal mt-1">Present vs Absent over the last 7 recorded days</p>
            </div>
            <button className="p-1.5 text-muted-foreground hover:text-primary rounded-md transition-colors">
              <RefreshCcw size={16} />
            </button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'var(--foreground)', fontWeight: '500' }}
                  />
                  <Area type="monotone" dataKey="present" name="Present" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAbsent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ring Chart */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">Date Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">Distribution of attendance for selected date</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    itemStyle={{ color: 'var(--foreground)', fontWeight: '500' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {trafficData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                  <span className="text-sm text-muted-foreground font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
