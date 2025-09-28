import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, Check, X, ExternalLink } from 'lucide-react';

interface FooterLink {
  _id: string;
  title: string;
  url: string;
  section: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
}

interface FooterPage {
  _id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
}

interface FooterSettings {
  companyName: string;
  companyDescription: string;
  locations: string[];
  socialLinks: any;
}

export default function FooterDebug() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const testAPIs = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing Footer APIs...');
      
      // Test footer links API
      const linksResponse = await fetch('/api/footer/links');
      console.log('Links API Response:', linksResponse.status);
      const linksData = await linksResponse.json();
      console.log('Links Data:', linksData);
      
      if (linksData.success) {
        setLinks(linksData.data);
      }

      // Test footer settings API
      const settingsResponse = await fetch('/api/footer/settings');
      console.log('Settings API Response:', settingsResponse.status);
      const settingsData = await settingsResponse.json();
      console.log('Settings Data:', settingsData);
      
      if (settingsData.success) {
        setSettings(settingsData.data);
      }

      // Test pages API
      const pagesResponse = await fetch('/api/content/pages');
      console.log('Pages API Response:', pagesResponse.status);
      const pagesData = await pagesResponse.json();
      console.log('Pages Data:', pagesData);
      
      if (pagesData.success) {
        setPages(pagesData.data.filter(p => p.status === 'published'));
      }

      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPIs();
  }, []);

  const linksBySection = links.reduce((acc, link) => {
    if (!acc[link.section]) acc[link.section] = [];
    acc[link.section].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Footer Debug Panel</h1>
        <Button onClick={testAPIs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Test APIs
        </Button>
      </div>

      {lastUpdate && (
        <p className="text-sm text-gray-500">Last updated: {lastUpdate}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Footer Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Footer Links ({links.length})</span>
              {links.length > 0 ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(linksBySection).map(([section, sectionLinks]) => (
              <div key={section} className="mb-4">
                <h4 className="font-semibold text-sm mb-2 capitalize">{section.replace('_', ' ')}</h4>
                <div className="space-y-2">
                  {sectionLinks.map(link => (
                    <div key={link._id} className="flex items-center justify-between text-xs">
                      <span>{link.title}</span>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {link.order}
                        </Badge>
                        {link.isExternal && <ExternalLink className="h-3 w-3" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-red-500 text-sm">No footer links found</p>
            )}
          </CardContent>
        </Card>

        {/* Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Published Pages ({pages.length})</span>
              {pages.length > 0 ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pages.map(page => (
                <div key={page._id} className="flex items-center justify-between text-xs">
                  <span>{page.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {page.type}
                  </Badge>
                </div>
              ))}
            </div>
            {pages.length === 0 && (
              <p className="text-red-500 text-sm">No published pages found</p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Footer Settings</span>
              {settings ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings ? (
              <div className="space-y-2 text-xs">
                <div><strong>Company:</strong> {settings.companyName}</div>
                <div><strong>Locations:</strong> {settings.locations?.length || 0}</div>
                <div><strong>Social Links:</strong> {Object.keys(settings.socialLinks || {}).length}</div>
              </div>
            ) : (
              <p className="text-red-500 text-sm">No footer settings found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Test */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-semibold">GET /api/footer/links</div>
              <div className="text-blue-600">Returns: {links.length} active links</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="font-semibold">GET /api/content/pages</div>
              <div className="text-green-600">Returns: {pages.length} published pages</div>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <div className="font-semibold">GET /api/footer/settings</div>
              <div className="text-purple-600">Returns: {settings ? 'Settings found' : 'No settings'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview of what footer should show */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Footer Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2">
                {linksBySection.quick_links?.map(link => (
                  <li key={link._id}>
                    <a href={link.url} className="text-blue-600 hover:underline text-sm">
                      {link.title}
                    </a>
                  </li>
                ))}
                {(!linksBySection.quick_links || linksBySection.quick_links.length === 0) && (
                  <li className="text-red-500 text-sm">No quick links found</li>
                )}
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h4 className="font-semibold mb-3">Legal & Support</h4>
              <ul className="space-y-2">
                {pages.filter(p => p.type === 'policy' || p.type === 'terms').map(page => (
                  <li key={page._id}>
                    <a href={`/page/${page.slug}`} className="text-blue-600 hover:underline text-sm">
                      {page.title}
                    </a>
                  </li>
                ))}
                {linksBySection.legal?.map(link => (
                  <li key={link._id}>
                    <a href={link.url} className="text-blue-600 hover:underline text-sm">
                      {link.title}
                    </a>
                  </li>
                ))}
                {linksBySection.support?.map(link => (
                  <li key={link._id}>
                    <a href={link.url} className="text-blue-600 hover:underline text-sm">
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Other Pages */}
            <div>
              <h4 className="font-semibold mb-3">Other Pages</h4>
              <ul className="space-y-2">
                {pages.filter(p => p.type === 'page').map(page => (
                  <li key={page._id}>
                    <a href={`/page/${page.slug}`} className="text-blue-600 hover:underline text-sm">
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
