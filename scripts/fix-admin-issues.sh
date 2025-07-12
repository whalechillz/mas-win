#!/bin/bash

# Fix admin dashboard issues
echo "Fixing admin dashboard issues..."

# 1. Fix ContactManagement search
cat > /tmp/contact-search-fix.patch << 'EOF'
--- a/components/admin/contacts/ContactManagement.tsx
+++ b/components/admin/contacts/ContactManagement.tsx
@@ -64,8 +64,10 @@ export function ContactManagement({ contacts, supabase, onUpdate }: ContactManag
   const filteredContacts = useMemo(() => {
     return contacts.filter(contact => {
       // 검색어 필터
-      if (searchTerm && !contact.name.includes(searchTerm) && !contact.phone.includes(searchTerm)) {
-        return false;
+      if (searchTerm) {
+        const searchLower = searchTerm.toLowerCase();
+        const phoneDigits = contact.phone.replace(/\D/g, '');
+        const searchDigits = searchTerm.replace(/\D/g, '');
+        
+        if (!contact.name.toLowerCase().includes(searchLower) && 
+            !phoneDigits.includes(searchDigits)) {
+          return false;
+        }
       }
EOF

# 2. Fix BookingManagement detail view
cat > /tmp/booking-detail-fix.patch << 'EOF'
--- a/components/admin/bookings/BookingManagementFull.tsx
+++ b/components/admin/bookings/BookingManagementFull.tsx
@@ -320,7 +320,7 @@ export function BookingManagement({ bookings, supabase, onUpdate }: BookingManag
                     <span className="text-sm">{booking.club || '-'}</span>
                   </td>
-                  <td className="px-4 py-3">
+                  <td className="px-4 py-3 relative">
                     {(booking.swing_style || booking.priority || booking.current_distance) ? (
                       <button
                         onClick={() => setShowDetails(showDetails === booking.id ? null : booking.id)}
@@ -334,7 +334,7 @@ export function BookingManagement({ bookings, supabase, onUpdate }: BookingManag
                     )}
                     {showDetails === booking.id && (
-                      <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
+                      <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-48 left-0">
EOF

# 3. Fix CustomerStyleAnalysis donut chart
cat > /tmp/donut-chart-fix.patch << 'EOF'
--- a/components/admin/dashboard/CustomerStyleAnalysis.tsx
+++ b/components/admin/dashboard/CustomerStyleAnalysis.tsx
@@ -71,10 +71,16 @@ export function CustomerStyleAnalysis({ bookings }: CustomerStyleAnalysisProps) 
             <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
               {(() => {
                 let currentAngle = -90;
+                const total = bookings.length || 1; // Prevent division by zero
+                
                 return styleAnalysis.map((item, index) => {
-                  const angle = (item.value / bookings.length) * 360;
+                  const percentage = (item.value / total) * 100;
+                  const angle = (percentage / 100) * 360;
+                  
+                  if (angle === 0) return null; // Skip zero-angle segments
+                  
                   const startAngle = currentAngle;
                   const endAngle = currentAngle + angle;
+                  const midAngle = (startAngle + endAngle) / 2;
                   currentAngle = endAngle;
 
                   const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
@@ -84,6 +90,11 @@ export function CustomerStyleAnalysis({ bookings }: CustomerStyleAnalysisProps) 
 
                   const largeArcFlag = angle > 180 ? 1 : 0;
 
+                  // Fix for single segment (100%)
+                  if (styleAnalysis.length === 1) {
+                    return <circle key={index} cx="100" cy="100" r="80" fill={colors[0]} />;
+                  }
+
                   return (
                     <path
                       key={index}
@@ -91,6 +102,7 @@ export function CustomerStyleAnalysis({ bookings }: CustomerStyleAnalysisProps) 
                       fill={colors[index % colors.length]}
                       stroke="white"
                       strokeWidth="2"
+                      className="transition-all duration-300 hover:opacity-80"
                     />
                   );
                 });
EOF

echo "Patches created. Ready to apply fixes."
