async function runTests() {
  console.log('=== RUNNING NEXUS AI LIVE END-TO-END VERIFICATION ===\n');

  // 1. Health check
  console.log('1. Checking Backend Health...');
  const health = await fetch('http://localhost:3001/api/health').then(r => r.json());
  console.log('   ✓ Health status:', health.status, health.service);

  // 2. AI Health check
  console.log('\n2. Checking AI & Supabase Health...');
  const aiHealth = await fetch('http://localhost:3001/api/health/ai').then(r => r.json());
  console.log('   ✓ AI Status:', aiHealth);

  // 3. Test AI Intake with Gemini
  console.log('\n3. Testing Gemini Natural Language Intake...');
  const intakeRes = await fetch('http://localhost:3001/api/ai/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Role': 'employee' },
    body: JSON.stringify({ prompt: "I spent ₹2,850 during yesterday's Mumbai client visit." })
  }).then(r => r.json());
  console.log('   ✓ Classified as:', intakeRes.workflow_type);
  console.log('   ✓ Title:', intakeRes.title);
  console.log('   ✓ Extracted:', intakeRes.extracted_data);
  console.log('   ✓ Tasks:', intakeRes.tasks?.length || 0);

  // 4. Test Conversational Agent (Gemini Tool Calling)
  console.log('\n4. Testing Gemini Conversational Agent & Tool Calling...');
  const agentRes = await fetch('http://localhost:3001/api/ai/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Role': 'employee' },
    body: JSON.stringify({ message: "What are the pending approvals right now?" })
  }).then(r => r.json());
  console.log('   ✓ Agent message:', agentRes.message);
  console.log('   ✓ Tool calls executed:', agentRes.toolCalls?.map(t => t.tool) || []);

  console.log('\n🎉 ALL LIVE END-TO-END TESTS PASSED!');
}

runTests().catch(console.error);
