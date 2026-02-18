// Test script to verify axios API calls for analytics
// Run this in the browser console or as a separate script

import api from './api.js';

console.log('🧪 Testing Analytics API Calls...\n');

// Test Services Analytics
async function testServicesAnalytics() {
  try {
    console.log('📊 Testing Services Analytics...');
    const response = await api.get('/admin/analytics/services');
    console.log('✅ Services Analytics Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Services Analytics Failed:', error);
    return null;
  }
}

// Test Courses/Products Analytics
async function testCoursesProductsAnalytics() {
  try {
    console.log('📚 Testing Courses/Products Analytics...');
    const response = await api.get('/admin/analytics/courses-products');
    console.log('✅ Courses/Products Analytics Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Courses/Products Analytics Failed:', error);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Analytics API Tests...\n');

  const servicesData = await testServicesAnalytics();
  console.log('\n');

  const productsData = await testCoursesProductsAnalytics();
  console.log('\n');

  if (servicesData && productsData) {
    console.log('🎉 All tests passed! Analytics data is available.');
  } else {
    console.log('⚠️ Some tests failed. Check the backend and authentication.');
  }
}

// Export for use in browser console
(window as any).testAnalyticsAPI = runTests;

// Auto-run if not in browser
if (typeof window === 'undefined') {
  runTests();
}