const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const env = require('../lib/env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

// ============================================
// NEXUS AI TOOL DECLARATIONS FOR GEMINI
// These are the function schemas Gemini can call
// ============================================

const NEXUS_TOOLS = [
  {
    name: 'create_workflow',
    description: 'Create a new company operations workflow (expense, approval, helpdesk, onboarding, meetingops). Use this when the user wants to submit a request, report an issue, onboard someone, or process meeting notes.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_type: { type: SchemaType.STRING, description: 'Type of workflow', enum: ['approval', 'expense', 'onboarding', 'helpdesk', 'meetingops'] },
        title: { type: SchemaType.STRING, description: 'Clear descriptive title for the workflow' },
        summary: { type: SchemaType.STRING, description: 'One sentence summary of the request' },
        priority: { type: SchemaType.STRING, description: 'Priority level', enum: ['low', 'normal', 'high', 'critical'] },
        department: { type: SchemaType.STRING, description: 'Relevant department (Engineering, Finance, HR, IT, etc.)' },
        extracted_data: { type: SchemaType.STRING, description: 'JSON string of extracted structured data (amount, category, date, employee_name, role, issue, sla_minutes, etc.)' },
        risk_flags: { type: SchemaType.STRING, description: 'JSON array string of risk flags if any, e.g. ["amount exceeds threshold"]' },
        missing_information: { type: SchemaType.STRING, description: 'JSON array string of missing fields, e.g. ["receipt not provided"]' },
        tasks: { type: SchemaType.STRING, description: 'JSON array string of tasks to create: [{title, assignee_role, assignee_name, due_description}]' },
        requires_approval: { type: SchemaType.BOOLEAN, description: 'Whether this workflow needs manager/authorized approval' },
        approver_role: { type: SchemaType.STRING, description: 'Role required for approval (manager, finance, hr, admin)' }
      },
      required: ['workflow_type', 'title', 'summary', 'priority']
    }
  },
  {
    name: 'get_user_profile',
    description: 'Get the current authenticated user\'s profile information including name, role, department, and manager.',
    parameters: { type: SchemaType.OBJECT, properties: {} }
  },
  {
    name: 'get_dashboard_metrics',
    description: 'Get operational dashboard metrics including active workflows, pending approvals, open tasks, and alerts count.',
    parameters: { type: SchemaType.OBJECT, properties: {} }
  },
  {
    name: 'list_workflows',
    description: 'List workflows filtered by type, status, or department.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_type: { type: SchemaType.STRING, description: 'Filter by type' },
        status: { type: SchemaType.STRING, description: 'Filter by status' },
        limit: { type: SchemaType.NUMBER, description: 'Max results (default 10)' }
      }
    }
  },
  {
    name: 'get_workflow',
    description: 'Get detailed information about a specific workflow including steps, tasks, approvals, and activity log.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_id: { type: SchemaType.STRING, description: 'UUID of the workflow' }
      },
      required: ['workflow_id']
    }
  },
  {
    name: 'approve_workflow',
    description: 'Approve a pending workflow approval. Only authorized approvers can call this.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_id: { type: SchemaType.STRING, description: 'UUID of the workflow to approve' },
        comments: { type: SchemaType.STRING, description: 'Approval comments' }
      },
      required: ['workflow_id']
    }
  },
  {
    name: 'reject_workflow',
    description: 'Reject a pending workflow approval. Only authorized approvers can call this.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_id: { type: SchemaType.STRING, description: 'UUID of the workflow to reject' },
        comments: { type: SchemaType.STRING, description: 'Rejection reason' }
      },
      required: ['workflow_id']
    }
  },
  {
    name: 'update_task',
    description: 'Update a task status (complete, reopen, block).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        task_id: { type: SchemaType.STRING, description: 'UUID of the task' },
        status: { type: SchemaType.STRING, description: 'New status', enum: ['pending', 'in_progress', 'completed', 'blocked'] }
      },
      required: ['task_id', 'status']
    }
  },
  {
    name: 'run_workflow_monitor',
    description: 'Run the AI operations monitor to check for SLA risks, overdue tasks, blocked workflows, and generate alerts.',
    parameters: { type: SchemaType.OBJECT, properties: {} }
  },
  {
    name: 'generate_operations_report',
    description: 'Generate an executive operations report summarizing current workflow status, bottlenecks, and recommendations.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        report_type: { type: SchemaType.STRING, description: 'Type of report', enum: ['daily', 'weekly', 'custom'] }
      }
    }
  },
  {
    name: 'send_notification',
    description: 'Send a notification email about a workflow event (approval needed, task assigned, etc.).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        recipient_email: { type: SchemaType.STRING, description: 'Email address of recipient' },
        subject: { type: SchemaType.STRING, description: 'Email subject' },
        body: { type: SchemaType.STRING, description: 'Email body content' },
        workflow_id: { type: SchemaType.STRING, description: 'Related workflow ID' }
      },
      required: ['recipient_email', 'subject', 'body']
    }
  }
];

// ============================================
// SYSTEM PROMPT
// ============================================
const SYSTEM_INSTRUCTION = `You are NEXUS AI, the central operations agent for a company.

YOUR ROLE:
- Understand employee and manager requests in natural language.
- Identify the correct workflow type (approval, expense, onboarding, helpdesk, meetingops).
- Extract structured information from the request.
- Use your tools to create real workflows, tasks, and approvals.
- Never invent data that the user did not provide.
- Never approve/reject without explicit authorization.
- Always use the create_workflow tool when a user wants to submit a request.

WORKFLOW TYPES:
1. approval - Equipment purchases, software licenses, budget requests. Requires amount and reason.
2. expense - Reimbursement claims for travel, meals, business expenses. Extract amount, date, category.
3. onboarding - New employee joining. Extract name, role, department, joining date.
4. helpdesk - IT issues, hardware/software problems. Assess priority and SLA urgency.
5. meetingops - Meeting notes/transcripts. Extract action items with owners and deadlines.

RULES:
- For expense/approval: always extract the amount in INR.
- For helpdesk: assess if it's critical (imminent deadline, business-blocking) or normal.
- For onboarding: generate 4-6 onboarding tasks appropriate for the role.
- For meetingops: extract each action item as a separate task with owner and deadline.
- Always include risk_flags if you detect policy issues (e.g., amount > 10000 for expenses).
- Use "normal" priority unless urgency signals are present.
- Critical priority only for: production outages, imminent client impact, security incidents.
- When creating tasks as JSON, use this format: [{"title":"...", "assignee_role":"Manager|IT|HR|Finance|Employee", "assignee_name":"...", "due_description":"in 2 days"}]
- For extracted_data JSON, include all relevant structured fields.

RESPONSE STYLE:
- Be concise and professional.
- After creating a workflow, confirm what was created and what happens next.
- If information is missing, ask the user to provide it before creating the workflow.
- Never expose internal IDs, tokens, or system configuration.`;

// ============================================
// AI AGENT: Real Gemini Tool-Calling Loop
// ============================================
async function runAgent(userMessage, userProfile, toolExecutor, conversationHistory = []) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{
      functionDeclarations: NEXUS_TOOLS
    }]
  });

  // Build conversation context
  const contextMessage = `Current User: ${userProfile.full_name || userProfile.email} (${userProfile.role}, ${userProfile.department})
User ID: ${userProfile.id}
Timestamp: ${new Date().toISOString()}

User Request: ${userMessage}`;

  const contents = [
    ...conversationHistory,
    { role: 'user', parts: [{ text: contextMessage }] }
  ];

  const toolCallTrace = [];
  let maxLoops = 5;
  let response;
  let finalText = '';

  while (maxLoops > 0) {
    maxLoops--;

    let result;
    let attempts = 0;
    while (attempts < 3) {
      try {
        result = await model.generateContent({ contents });
        response = result.response;
        break;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.error('Gemini API error after 3 attempts:', err.message);
          throw new Error(`AI service error: ${err.message}`);
        }
        console.warn(`Gemini temporary error (${err.message.substring(0, 60)}), retrying in ${attempts * 1000}ms...`);
        await new Promise(r => setTimeout(r, attempts * 1000));
      }
    }

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No response from AI model');
    }

    const parts = candidate.content?.parts || [];

    // Check for function calls
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length === 0) {
      // Final text response — no more tool calls
      finalText = parts.map(p => p.text).filter(Boolean).join('\n');
      break;
    }

    // Process each function call
    const functionResponses = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      console.log(`  🔧 Tool call: ${name}`, JSON.stringify(args).substring(0, 200));

      let toolResult;
      try {
        toolResult = await toolExecutor(name, args || {}, userProfile);
        toolCallTrace.push({
          tool: name,
          args: sanitizeArgs(args),
          success: true,
          summary: typeof toolResult === 'object' 
            ? (toolResult.summary || toolResult.message || 'Success') 
            : String(toolResult).substring(0, 200)
        });
      } catch (err) {
        console.error(`  ❌ Tool error [${name}]:`, err.message);
        toolResult = { error: err.message };
        toolCallTrace.push({ tool: name, args: sanitizeArgs(args), success: false, error: err.message });
      }

      functionResponses.push({
        functionResponse: {
          name,
          response: typeof toolResult === 'object' ? toolResult : { result: toolResult }
        }
      });
    }

    // Add model's full response + our function responses to conversation
    contents.push(candidate.content);
    contents.push({ role: 'user', parts: functionResponses });
  }

  // Extract workflow from trace if one was created
  const createCall = toolCallTrace.find(t => t.tool === 'create_workflow' && t.success);

  return {
    success: true,
    message: finalText || 'Request processed successfully.',
    toolCalls: toolCallTrace,
    workflow: createCall?.result || null,
    ai: {
      model: 'gemini-3.8-flash',
      toolCallCount: toolCallTrace.length,
      hadToolCalls: toolCallTrace.length > 0
    }
  };
}

function sanitizeArgs(args) {
  if (!args) return {};
  const clean = { ...args };
  // Never log tokens or keys
  delete clean.access_token;
  delete clean.refresh_token;
  delete clean.api_key;
  return clean;
}

module.exports = { runAgent, NEXUS_TOOLS, SYSTEM_INSTRUCTION };
