import { useLocation, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const Navbar = () => {
  const location = useLocation();
  const params = useParams();
  
  const getBreadcrumbItems = () => {
    const items = [
      { label: "New York", href: "/dockets", isLast: false }
    ];
    
    if (location.pathname === "/dockets") {
      items.push({ label: "Dockets", href: "/dockets", isLast: true });
    } else if (location.pathname === "/orgs") {
      items.push({ label: "Organizations", href: "/orgs", isLast: true });
    } else if (location.pathname.startsWith("/org/")) {
      const orgName = params.orgName ? decodeURIComponent(params.orgName) : "Organization";
      items.push({ label: orgName, href: location.pathname, isLast: true });
    } else if (location.pathname.startsWith("/docket/")) {
      const docketId = params.docket_govid || "Docket";
      items.push({ label: docketId, href: location.pathname, isLast: true });
    }
    
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-end">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!item.isLast && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
};

export default Navbar;