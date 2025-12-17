import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, Database, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">Manage application preferences and configurations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="integrations">Data Sources</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Basic company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="Acme Laboratory Solutions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" defaultValue="contact@acmelabs.com" />
              </div>
              <Button variant="default">Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Customize AI behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-summarization</Label>
                  <p className="text-sm text-muted-foreground">Automatically extract RFP requirements</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Smart Matching</Label>
                  <p className="text-sm text-muted-foreground">Enable AI-powered product matching</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="default">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "John Admin", email: "john@acmelabs.com", role: "Admin" },
                  { name: "Sarah Manager", email: "sarah@acmelabs.com", role: "Manager" },
                  { name: "Mike Analyst", email: "mike@acmelabs.com", role: "Analyst" },
                ].map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{user.role}</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
                <Button variant="default" className="w-full mt-4">Add New User</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Data Source Integrations</CardTitle>
              <CardDescription>Configure RFP portals and product repositories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Government RFP Portal", status: "Connected", type: "RFP Source" },
                  { name: "Company ERP System", status: "Connected", type: "Product Data" },
                  { name: "Email Integration", status: "Active", type: "RFP Source" },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-success">{integration.status}</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
                <Button variant="default" className="w-full mt-4">Add Integration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New RFP Detected</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new RFPs are found</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Deadline Reminders</Label>
                  <p className="text-sm text-muted-foreground">Alerts 48 hours before deadline</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Approval Requests</Label>
                  <p className="text-sm text-muted-foreground">When proposals need approval</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="default">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
