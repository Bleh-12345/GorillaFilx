import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useUserVideos } from '@/hooks/use-movies';
import Navbar from '@/components/Navbar';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Loader2, Users, PlayCircle, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';

// Type for analytics data
interface AnalyticsData {
  subscribers: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  totalDislikes: number;
  videosCount: number;
  viewsPerVideo: { name: string; views: number }[];
  commentsPerVideo: { name: string; comments: number }[];
  engagementRates: { name: string; rate: number }[];
  viewsOverTime: { date: string; views: number }[];
  subscribersOverTime: { date: string; subscribers: number }[];
  interactionBreakdown: { name: string; value: number }[];
}

// Colors for charts
const COLORS = ['#e50914', '#b20710', '#831010', '#6a0d0e', '#500b0b', '#e5094f', '#e50969'];

const Analytics = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const userId = id ? parseInt(id) : user?.id ?? null;
  const { data: userVideos, isLoading: isLoadingVideos } = useUserVideos(userId);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // This would normally fetch from an API, but for now we'll generate data based on actual user videos
  useEffect(() => {
    if (userVideos) {
      // Calculate analytics from user videos
      const totalViews = userVideos.reduce((sum: number, video: any) => sum + video.views, 0);
      const totalLikes = userVideos.reduce((sum: number, video: any) => sum + (video.likes || 0), 0);
      const totalDislikes = userVideos.reduce((sum: number, video: any) => sum + (video.dislikes || 0), 0);
      
      // For subscribers and comments, we'll use calculated values based on views
      const subscribers = Math.round(totalViews * 0.15);
      const totalComments = Math.round(totalViews * 0.05);
      
      // Generate data for charts
      const viewsPerVideo = userVideos.map((video: any) => ({
        name: video.title.length > 15 ? `${video.title.substring(0, 15)}...` : video.title,
        views: video.views
      }));
      
      const commentsPerVideo = userVideos.map((video: any) => ({
        name: video.title.length > 15 ? `${video.title.substring(0, 15)}...` : video.title,
        comments: Math.round(video.views * 0.05) // Estimating comments as 5% of views
      }));
      
      const engagementRates = userVideos.map((video: any) => ({
        name: video.title.length > 15 ? `${video.title.substring(0, 15)}...` : video.title,
        rate: ((video.likes || 0) + (video.dislikes || 0) + Math.round(video.views * 0.05)) / video.views * 100
      }));
      
      // Generate mock time-series data
      const now = new Date();
      const viewsOverTime = Array(7).fill(0).map((_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          views: Math.round(totalViews * (0.1 + 0.05 * i) / 7)
        };
      });
      
      const subscribersOverTime = Array(7).fill(0).map((_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          subscribers: Math.round(subscribers * (0.7 + 0.05 * i))
        };
      });
      
      const interactionBreakdown = [
        { name: 'Views', value: totalViews },
        { name: 'Likes', value: totalLikes },
        { name: 'Dislikes', value: totalDislikes },
        { name: 'Comments', value: totalComments }
      ];
      
      // Set the analytics data
      setAnalytics({
        subscribers,
        totalViews,
        totalComments,
        totalLikes,
        totalDislikes,
        videosCount: userVideos.length,
        viewsPerVideo,
        commentsPerVideo,
        engagementRates,
        viewsOverTime,
        subscribersOverTime,
        interactionBreakdown
      });
      
      setLoading(false);
    }
  }, [userVideos]);

  if (isLoadingVideos || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Handle case where user has no videos
  if (!userVideos || userVideos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto pt-24 px-4">
          <h1 className="text-2xl font-bold mb-4">Channel Analytics</h1>
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                Upload videos to start seeing analytics for your channel.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // If we have analytics data, render the dashboard
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Channel Analytics - GorillaFlix</title>
      </Helmet>
      
      <Navbar />

      <div className="container mx-auto pt-24 px-4 pb-16">
        <h1 className="text-3xl font-bold mb-6 text-slate-100">Channel Analytics</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Subscribers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics?.subscribers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center space-x-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                <span>Total Views</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics?.totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Across {analytics?.videosCount} videos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Comments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics?.totalComments.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Avg. {Math.round(analytics?.totalComments || 0 / (analytics?.videosCount || 1))} per video</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Engagement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">{analytics?.totalLikes.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">{analytics?.totalDislikes.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round((analytics?.totalLikes || 0) / ((analytics?.totalLikes || 0) + (analytics?.totalDislikes || 1)) * 100)}% positive
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-900 border-b border-slate-800 p-0 h-12">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:shadow-none rounded-none h-12 px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:shadow-none rounded-none h-12 px-4"
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="audience" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:shadow-none rounded-none h-12 px-4"
            >
              Audience
            </TabsTrigger>
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:shadow-none rounded-none h-12 px-4"
            >
              Revenue
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Performance charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Views Over Time</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics?.viewsOverTime}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          itemStyle={{ color: '#F9FAFB' }}
                        />
                        <Line type="monotone" dataKey="views" stroke="#e50914" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Subscribers Growth</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics?.subscribersOverTime}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          itemStyle={{ color: '#F9FAFB' }}
                        />
                        <Line type="monotone" dataKey="subscribers" stroke="#e50914" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Views by Video</CardTitle>
                  <CardDescription>Top performing content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics?.viewsPerVideo}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          itemStyle={{ color: '#F9FAFB' }}
                        />
                        <Bar dataKey="views" fill="#e50914" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Interaction Breakdown</CardTitle>
                  <CardDescription>How viewers engage with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.interactionBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${Math.round(Number(percent) * 100)}%`}
                        >
                          {analytics?.interactionBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          itemStyle={{ color: '#F9FAFB' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Comments by Video</CardTitle>
                <CardDescription>Most discussed content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.commentsPerVideo}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        itemStyle={{ color: '#F9FAFB' }}
                      />
                      <Bar dataKey="comments" fill="#e50914" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Engagement Rate by Video</CardTitle>
                <CardDescription>Percentage of viewers who interact with your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.engagementRates}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        itemStyle={{ color: '#F9FAFB' }}
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Engagement Rate']}
                      />
                      <Bar dataKey="rate" fill="#e50914" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Audience Tab */}
          <TabsContent value="audience">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
                <CardDescription>Coming soon! We're working on detailed audience demographics.</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex flex-col items-center justify-center">
                <Users className="h-16 w-16 text-slate-700 mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Audience analytics will help you understand who's watching your videos, including age groups, 
                  locations, and viewing habits.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Revenue Reports</CardTitle>
                <CardDescription>Coming soon! We're working on monetization features.</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex flex-col items-center justify-center">
                <TrendingUp className="h-16 w-16 text-slate-700 mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Once you're eligible for monetization, you'll be able to track your earnings
                  and monetization performance in this dashboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;