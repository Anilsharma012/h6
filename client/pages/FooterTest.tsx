import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface FooterTestData {
  settings: any;
  links: any[];
  stats: {
    totalLinks: number;
    activeLinks: number;
    hasSettings: boolean;
    lastUpdated: string;
  };
}

export default function FooterTest() {
  const [testData, setTestData] = useState<FooterTestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testFooterEndpoints = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Test the footer test endpoint
      const response = await fetch('/api/footer/test');
      console.log('Footer test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Footer test data:', data);
        if (data.success) {
          setTestData(data.data);
        } else {
          setError(data.error || 'Test failed');
        }
      } else {
        const errorText = await response.text();
        setError(`Test failed: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Network error: ${err}`);
      console.error('Footer test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testIndividualEndpoints = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing individual endpoints...');
      
      // Test settings endpoint
      const settingsResponse = await fetch('/api/footer/settings');
      console.log('Settings response:', settingsResponse.status);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('Settings data:', settingsData);
      }

      // Test links endpoint
      const linksResponse = await fetch('/api/footer/links');
      console.log('Links response:', linksResponse.status);
      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        console.log('Links data:', linksData);
      }

      setError('Check console for detailed responses');
    } catch (err) {
      setError(`Network error: ${err}`);
      console.error('Individual endpoints test error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testFooterEndpoints();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Footer System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>API Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={testFooterEndpoints} disabled={loading}>
                  {loading ? 'Testing...' : 'Test All Endpoints'}
                </Button>
                <Button onClick={testIndividualEndpoints} disabled={loading} variant="outline">
                  Test Individual
                </Button>
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
                  {error}
                </div>
              )}
              
              {testData && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Test Results:</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Total Links:</strong> {testData.stats.totalLinks}</p>
                    <p><strong>Active Links:</strong> {testData.stats.activeLinks}</p>
                    <p><strong>Has Settings:</strong> {testData.stats.hasSettings ? 'Yes' : 'No'}</p>
                    <p><strong>Last Updated:</strong> {new Date(testData.stats.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Settings Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {testData?.settings && (
                <div className="space-y-2 text-sm">
                  <p><strong>Company:</strong> {testData.settings.companyName}</p>
                  <p><strong>Logo:</strong> {testData.settings.companyLogo}</p>
                  <p><strong>Description:</strong> {testData.settings.companyDescription?.substring(0, 100)}...</p>
                  <p><strong>Show Locations:</strong> {testData.settings.showLocations ? 'Yes' : 'No'}</p>
                  <p><strong>Locations:</strong> {testData.settings.locations?.join(', ')}</p>
                  
                  <div className="mt-4">
                    <p className="font-semibold">Social Links:</p>
                    <ul className="ml-4 space-y-1">
                      {testData.settings.socialLinks?.facebook && <li>✓ Facebook</li>}
                      {testData.settings.socialLinks?.twitter && <li>✓ Twitter</li>}
                      {testData.settings.socialLinks?.instagram && <li>✓ Instagram</li>}
                      {testData.settings.socialLinks?.youtube && <li>✓ YouTube</li>}
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-semibold">Contact Info:</p>
                    <ul className="ml-4 space-y-1">
                      {testData.settings.contactInfo?.phone && <li>📞 {testData.settings.contactInfo.phone}</li>}
                      {testData.settings.contactInfo?.email && <li>✉️ {testData.settings.contactInfo.email}</li>}
                      {testData.settings.contactInfo?.address && <li>📍 {testData.settings.contactInfo.address}</li>}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Footer Links</CardTitle>
            </CardHeader>
            <CardContent>
              {testData?.links && testData.links.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['quick_links', 'legal', 'company', 'support'].map(section => {
                    const sectionLinks = testData.links.filter(link => link.section === section);
                    return sectionLinks.length > 0 && (
                      <div key={section} className="space-y-2">
                        <h4 className="font-semibold capitalize">{section.replace('_', ' ')}</h4>
                        <ul className="space-y-1 text-sm">
                          {sectionLinks.map(link => (
                            <li key={link._id} className="flex items-center space-x-2">
                              <span className={link.isActive ? 'text-green-600' : 'text-red-600'}>
                                {link.isActive ? '✓' : '✗'}
                              </span>
                              <span>{link.title}</span>
                              <span className="text-gray-400">→ {link.url}</span>
                              {link.isExternal && <span className="text-blue-500">🔗</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No footer links found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
