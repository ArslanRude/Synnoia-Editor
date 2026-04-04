/**
 * Professional Document Templates
 * 
 * This file contains comprehensive, professionally designed templates
 * for various business and technical documents.
 */

export interface Template {
  title: string
  description: string
  content: string
}

export const templates: Template[] = [
  {
    title: 'Business Proposal',
    description: 'Professional business proposal template',
    content: `
      <h1>Business Proposal</h1>
      <h2>Executive Summary</h2>
      <p><strong>Project Title:</strong> [Project Name]</p>
      <p><strong>Client:</strong> [Client Company Name]</p>
      <p><strong>Date:</strong> [Current Date]</p>
      <p><strong>Prepared by:</strong> [Your Name/Company]</p>
      
      <h2>Introduction</h2>
      <p>[Brief overview of the proposal and its purpose]</p>
      
      <h2>Project Objectives</h2>
      <ul>
        <li><strong>Primary Goal:</strong> [Main objective]</li>
        <li><strong>Secondary Goals:</strong> [Additional objectives]</li>
        <li><strong>Success Metrics:</strong> [How success will be measured]</li>
      </ul>
      
      <h2>Scope of Work</h2>
      <h3>Deliverables</h3>
      <ol>
        <li>[Deliverable 1 with description]</li>
        <li>[Deliverable 2 with description]</li>
        <li>[Deliverable 3 with description]</li>
      </ol>
      
      <h3>Timeline</h3>
      <ul>
        <li><strong>Phase 1:</strong> [Start Date] - [End Date] - [Description]</li>
        <li><strong>Phase 2:</strong> [Start Date] - [End Date] - [Description]</li>
        <li><strong>Phase 3:</strong> [Start Date] - [End Date] - [Description]</li>
      </ul>
      
      <h2>Investment</h2>
      <table>
        <tr><th>Item</th><th>Description</th><th>Cost</th></tr>
        <tr><td>[Service 1]</td><td>[Description]</td><td>$[Amount]</td></tr>
        <tr><td>[Service 2]</td><td>[Description]</td><td>$[Amount]</td></tr>
        <tr><td><strong>Total</strong></td><td></td><td><strong>$[Total Amount]</strong></td></tr>
      </table>
      
      <h2>Terms and Conditions</h2>
      <p>[Payment terms, cancellation policy, etc.]</p>
      
      <h2>Next Steps</h2>
      <ol>
        <li>Proposal review and approval</li>
        <li>Contract signing</li>
        <li>Project kickoff</li>
      </ol>
      
      <h2>Contact Information</h2>
      <p><strong>[Your Name]</strong><br>
      [Your Title]<br>
      [Company Name]<br>
      [Email Address]<br>
      [Phone Number]</p>
    `
  },
  {
    title: 'Meeting Minutes',
    description: 'Professional meeting minutes template',
    content: `
      <h1>Meeting Minutes</h1>
      <table style="width: 100%; border: none;">
        <tr><td><strong>Meeting Title:</strong></td><td>[Meeting Name/Topic]</td></tr>
        <tr><td><strong>Date:</strong></td><td>[Meeting Date]</td></tr>
        <tr><td><strong>Time:</strong></td><td>[Start Time] - [End Time]</td></tr>
        <tr><td><strong>Location:</strong></td><td>[Physical/Venue Location]</td></tr>
        <tr><td><strong>Virtual Platform:</strong></td><td>[Zoom/Teams/Other]</td></tr>
      </table>
      
      <h2>Attendees</h2>
      <h3>Present</h3>
      <ul>
        <li>[Name] - [Title/Role]</li>
        <li>[Name] - [Title/Role]</li>
        <li>[Name] - [Title/Role]</li>
      </ul>
      
      <h3>Absent</h3>
      <ul>
        <li>[Name] - [Reason for absence]</li>
      </ul>
      
      <h2>Agenda Items</h2>
      <ol>
        <li>[Agenda Item 1]</li>
        <li>[Agenda Item 2]</li>
        <li>[Agenda Item 3]</li>
      </ol>
      
      <h2>Discussion Summary</h2>
      <h3>Item 1: [Topic Name]</h3>
      <p><strong>Key Points Discussed:</strong></p>
      <ul>
        <li>[Discussion point 1]</li>
        <li>[Discussion point 2]</li>
      </ul>
      
      <h3>Item 2: [Topic Name]</h3>
      <p><strong>Key Points Discussed:</strong></p>
      <ul>
        <li>[Discussion point 1]</li>
        <li>[Discussion point 2]</li>
      </ul>
      
      <h2>Action Items</h2>
      <table style="width: 100%;">
        <tr><th>Action</th><th>Responsible</th><th>Due Date</th><th>Status</th></tr>
        <tr><td>[Action item 1]</td><td>[Person Name]</td><td>[Due Date]</td><td>Pending</td></tr>
        <tr><td>[Action item 2]</td><td>[Person Name]</td><td>[Due Date]</td><td>Pending</td></tr>
      </table>
      
      <h2>Decisions Made</h2>
      <ul>
        <li><strong>Decision 1:</strong> [Description of decision and rationale]</li>
        <li><strong>Decision 2:</strong> [Description of decision and rationale]</li>
      </ul>
      
      <h2>Next Meeting</h2>
      <p><strong>Date:</strong> [Next Meeting Date]<br>
      <strong>Time:</strong> [Next Meeting Time]<br>
      <strong>Location:</strong> [Next Meeting Location]</p>
      
      <h2>Additional Notes</h2>
      <p>[Any additional information or follow-up items]</p>
      
      <p><em>Minutes recorded by: [Your Name]</em></p>
    `
  },
  {
    title: 'Project Report',
    description: 'Comprehensive project status report',
    content: `
      <h1>Project Status Report</h1>
      
      <h2>Project Information</h2>
      <table style="width: 100%; border: none;">
        <tr><td><strong>Project Name:</strong></td><td>[Project Title]</td></tr>
        <tr><td><strong>Project Manager:</strong></td><td>[PM Name]</td></tr>
        <tr><td><strong>Reporting Period:</strong></td><td>[Start Date] - [End Date]</td></tr>
        <tr><td><strong>Report Date:</strong></td><td>[Current Date]</td></tr>
        <tr><td><strong>Project Phase:</strong></td><td>[Current Phase]</td></tr>
      </table>
      
      <h2>Executive Summary</h2>
      <p>[Brief overview of project status, key achievements, and critical issues]</p>
      
      <h2>Project Overview</h2>
      <h3>Objectives</h3>
      <ul>
        <li>[Primary objective]</li>
        <li>[Secondary objective 1]</li>
        <li>[Secondary objective 2]</li>
      </ul>
      
      <h3>Key Stakeholders</h3>
      <ul>
        <li><strong>Sponsor:</strong> [Name/Department]</li>
        <li><strong>Team Lead:</strong> [Name]</li>
        <li><strong>Key Users:</strong> [Departments/Individuals]</li>
      </ul>
      
      <h2>Progress Status</h2>
      <h3>Completed Deliverables</h3>
      <ul>
        <li>✅ [Deliverable 1] - [Completion Date]</li>
        <li>✅ [Deliverable 2] - [Completion Date]</li>
      </ul>
      
      <h3>In-Progress Items</h3>
      <ul>
        <li>🔄 [Item 1] - [Progress %] - [ETA]</li>
        <li>🔄 [Item 2] - [Progress %] - [ETA]</li>
      </ul>
      
      <h3>Upcoming Milestones</h3>
      <ul>
        <li>📅 [Milestone 1] - [Due Date]</li>
        <li>📅 [Milestone 2] - [Due Date]</li>
      </ul>
      
      <h2>Budget and Resources</h2>
      <h3>Budget Status</h3>
      <table style="width: 100%;">
        <tr><th>Category</th><th>Budgeted</th><th>Actual</th><th>Variance</th></tr>
        <tr><td>Personnel</td><td>$[Amount]</td><td>$[Amount]</td><td>$[Amount]</td></tr>
        <tr><td>Equipment</td><td>$[Amount]</td><td>$[Amount]</td><td>$[Amount]</td></tr>
        <tr><td>Software</td><td>$[Amount]</td><td>$[Amount]</td><td>$[Amount]</td></tr>
        <tr><td><strong>Total</strong></td><td><strong>$[Total]</strong></td><td><strong>$[Total]</strong></td><td><strong>$[Total]</strong></td></tr>
      </table>
      
      <h3>Resource Allocation</h3>
      <ul>
        <li><strong>Team Members:</strong> [Number] allocated / [Number] needed</li>
        <li><strong>External Resources:</strong> [Description]</li>
        <li><strong>Equipment:</strong> [Status of required equipment]</li>
      </ul>
      
      <h2>Risks and Issues</h2>
      <h3>Current Risks</h3>
      <table style="width: 100%;">
        <tr><th>Risk</th><th>Impact</th><th>Likelihood</th><th>Mitigation Plan</th></tr>
        <tr><td>[Risk description]</td><td>[High/Med/Low]</td><td>[High/Med/Low]</td><td>[Mitigation strategy]</td></tr>
        <tr><td>[Risk description]</td><td>[High/Med/Low]</td><td>[High/Med/Low]</td><td>[Mitigation strategy]</td></tr>
      </table>
      
      <h3>Open Issues</h3>
      <ul>
        <li><strong>Issue 1:</strong> [Description] - [Owner] - [Due Date]</li>
        <li><strong>Issue 2:</strong> [Description] - [Owner] - [Due Date]</li>
      </ul>
      
      <h2>Quality Metrics</h2>
      <ul>
        <li><strong>Defect Density:</strong> [Number] defects per [unit]</li>
        <li><strong>Test Coverage:</strong> [Percentage]%</li>
        <li><strong>Customer Satisfaction:</strong> [Score]/[Scale]</li>
        <li><strong>Performance Metrics:</strong> [Key performance indicators]</li>
      </ul>
      
      <h2>Lessons Learned</h2>
      <h3>Successes</h3>
      <ul>
        <li>[What went well and why]</li>
        <li>[Best practices identified]</li>
      </ul>
      
      <h3>Challenges</h3>
      <ul>
        <li>[What didn't go well and why]</li>
        <li>[How challenges were addressed]</li>
      </ul>
      
      <h2>Next Period Objectives</h2>
      <ol>
        <li>[Objective 1 for next period]</li>
        <li>[Objective 2 for next period]</li>
        <li>[Objective 3 for next period]</li>
      </ol>
      
      <h2>Recommendations</h2>
      <ul>
        <li>[Recommendation 1 with justification]</li>
        <li>[Recommendation 2 with justification]</li>
      </ul>
      
      <p><em>Report prepared by: [Your Name], [Your Title]</em></p>
    `
  },
  {
    title: 'SWOT Analysis',
    description: 'Strategic SWOT analysis template',
    content: `
      <h1>SWOT Analysis</h1>
      
      <h2>Analysis Overview</h2>
      <p><strong>Organization/Project:</strong> [Name]</p>
      <p><strong>Analysis Date:</strong> [Current Date]</p>
      <p><strong>Analysis Period:</strong> [Timeframe]</p>
      <p><strong>Prepared by:</strong> [Your Name/Department]</p>
      
      <h2>Strengths (Internal, Positive)</h2>
      <h3>Core Competencies</h3>
      <ul>
        <li><strong>[Strength 1]:</strong> [Description and impact]</li>
        <li><strong>[Strength 2]:</strong> [Description and impact]</li>
        <li><strong>[Strength 3]:</strong> [Description and impact]</li>
      </ul>
      
      <h3>Competitive Advantages</h3>
      <ul>
        <li>[Unique capability or resource]</li>
        <li>[Market position advantage]</li>
        <li>[Technology or process advantage]</li>
      </ul>
      
      <h3>Resources and Capabilities</h3>
      <ul>
        <li><strong>Human Resources:</strong> [Key skills and expertise]</li>
        <li><strong>Financial Resources:</strong> [Funding stability and capacity]</li>
        <li><strong>Technology:</strong> [Systems and tools]</li>
        <li><strong>Brand/Reputation:</strong> [Market perception]</li>
      </ul>
      
      <h2>Weaknesses (Internal, Negative)</h2>
      <h3>Areas for Improvement</h3>
      <ul>
        <li><strong>[Weakness 1]:</strong> [Description and potential impact]</li>
        <li><strong>[Weakness 2]:</strong> [Description and potential impact]</li>
        <li><strong>[Weakness 3]:</strong> [Description and potential impact]</li>
      </ul>
      
      <h3>Resource Limitations</h3>
      <ul>
        <li><strong>Skills Gaps:</strong> [Missing capabilities]</li>
        <li><strong>Financial Constraints:</strong> [Budget limitations]</li>
        <li><strong>Technology Debt:</strong> [Outdated systems or processes]</li>
        <li><strong>Capacity Issues:</strong> [Limited resources]</li>
      </ul>
      
      <h2>Opportunities (External, Positive)</h2>
      <h3>Market Opportunities</h3>
      <ul>
        <li><strong>[Opportunity 1]:</strong> [Description and potential value]</li>
        <li><strong>[Opportunity 2]:</strong> [Description and potential value]</li>
        <li><strong>[Opportunity 3]:</strong> [Description and potential value]</li>
      </ul>
      
      <h3>Industry Trends</h3>
      <ul>
        <li><strong>Technological:</strong> [Emerging technologies to leverage]</li>
        <li><strong>Market:</strong> [Growing market segments]</li>
        <li><strong>Regulatory:</strong> [Favorable regulatory changes]</li>
        <li><strong>Social:</strong> [Changing customer behaviors]</li>
      </ul>
      
      <h3>Partnership Possibilities</h3>
      <ul>
        <li>[Potential strategic partnerships]</li>
        <li>[Collaboration opportunities]</li>
        <li>[Acquisition targets]</li>
      </ul>
      
      <h2>Threats (External, Negative)</h2>
      <h3>Market Threats</h3>
      <ul>
        <li><strong>[Threat 1]:</strong> [Description and potential impact]</li>
        <li><strong>[Threat 2]:</strong> [Description and potential impact]</li>
        <li><strong>[Threat 3]:</strong> [Description and potential impact]</li>
      </ul>
      
      <h3>Competitive Pressures</h3>
      <ul>
        <li><strong>New Entrants:</strong> [Potential new competitors]</li>
        <li><strong>Substitute Products:</strong> [Alternative solutions]</li>
        <li><strong>Price Wars:</strong> [Market pricing pressures]</li>
      </ul>
      
      <h3>Environmental Factors</h3>
      <ul>
        <li><strong>Economic:</strong> [Economic conditions affecting business]</li>
        <li><strong>Regulatory:</strong> [Compliance requirements]</li>
        <li><strong>Technological:</strong> [Disruptive technologies]</li>
        <li><strong>Social:</strong> [Changing market preferences]</li>
      </ul>
      
      <h2>Strategic Implications</h2>
      <h3>SO Strategies (Strengths-Opportunities)</h3>
      <ul>
        <li>How to use strengths to capitalize on opportunities</li>
        <li>[Specific strategic initiative 1]</li>
        <li>[Specific strategic initiative 2]</li>
      </ul>
      
      <h3>WO Strategies (Weaknesses-Opportunities)</h3>
      <ul>
        <li>How to overcome weaknesses by taking advantage of opportunities</li>
        <li>[Specific strategic initiative 1]</li>
        <li>[Specific strategic initiative 2]</li>
      </ul>
      
      <h3>ST Strategies (Strengths-Threats)</h3>
      <ul>
        <li>How to use strengths to mitigate threats</li>
        <li>[Specific strategic initiative 1]</li>
        <li>[Specific strategic initiative 2]</li>
      </ul>
      
      <h3>WT Strategies (Weaknesses-Threats)</h3>
      <ul>
        <li>How to minimize weaknesses and avoid threats</li>
        <li>[Specific strategic initiative 1]</li>
        <li>[Specific strategic initiative 2]</li>
      </ul>
      
      <h2>Action Plan</h2>
      <table style="width: 100%;">
        <tr><th>Priority</th><th>Action</th><th>Responsible</th><th>Timeline</th><th>Success Metrics</th></tr>
        <tr><td>High</td><td>[Action 1]</td><td>[Person/Team]</td><td>[Timeline]</td><td>[Metrics]</td></tr>
        <tr><td>Medium</td><td>[Action 2]</td><td>[Person/Team]</td><td>[Timeline]</td><td>[Metrics]</td></tr>
        <tr><td>Low</td><td>[Action 3]</td><td>[Person/Team]</td><td>[Timeline]</td><td>[Metrics]</td></tr>
      </table>
      
      <h2>Monitoring and Review</h2>
      <ul>
        <li><strong>Review Frequency:</strong> [How often to review]</li>
        <li><strong>Key Indicators:</strong> [Metrics to track progress]</li>
        <li><strong>Update Schedule:</strong> [When to update analysis]</li>
      </ul>
      
      <p><em>Analysis conducted by: [Your Name/Team]</em></p>
    `
  },
  {
    title: 'Employee Review',
    description: 'Professional performance review template',
    content: `
      <h1>Performance Review</h1>
      
      <h2>Review Information</h2>
      <table style="width: 100%; border: none;">
        <tr><td><strong>Employee Name:</strong></td><td>[Employee Full Name]</td></tr>
        <tr><td><strong>Employee ID:</strong></td><td>[Employee ID]</td></tr>
        <tr><td><strong>Position:</strong></td><td>[Job Title]</td></tr>
        <tr><td><strong>Department:</strong></td><td>[Department Name]</td></tr>
        <tr><td><strong>Reviewer:</strong></td><td>[Manager Name]</td></tr>
        <tr><td><strong>Review Period:</strong></td><td>[Start Date] - [End Date]</td></tr>
        <tr><td><strong>Review Date:</strong></td><td>[Current Date]</td></tr>
      </table>
      
      <h2>Job Responsibilities</h2>
      <ol>
        <li>[Primary responsibility 1]</li>
        <li>[Primary responsibility 2]</li>
        <li>[Primary responsibility 3]</li>
        <li>[Primary responsibility 4]</li>
        <li>[Primary responsibility 5]</li>
      </ol>
      
      <h2>Goals and Objectives Review</h2>
      <h3>Previous Period Goals</h3>
      <table style="width: 100%;">
        <tr><th>Goal</th><th>Target</th><th>Actual</th><th>Status</th><th>Comments</th></tr>
        <tr><td>[Goal 1]</td><td>[Target metric]</td><td>[Actual result]</td><td>[Achieved/Partial/Not Met]</td><td>[Comments]</td></tr>
        <tr><td>[Goal 2]</td><td>[Target metric]</td><td>[Actual result]</td><td>[Achieved/Partial/Not Met]</td><td>[Comments]</td></tr>
        <tr><td>[Goal 3]</td><td>[Target metric]</td><td>[Actual result]</td><td>[Achieved/Partial/Not Met]</td><td>[Comments]</td></tr>
      </table>
      
      <h2>Performance Assessment</h2>
      <h3>Core Competencies</h3>
      <table style="width: 100%;">
        <tr><th>Competency</th><th>Rating (1-5)</th><th>Comments</th></tr>
        <tr><td><strong>Job Knowledge</strong><br>Demonstrates understanding of job requirements and industry knowledge</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Quality of Work</strong><br>Produces accurate, thorough, and professional work</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Productivity</strong><br>Manages workload effectively and meets deadlines</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Initiative</strong><br>Takes proactive approach to responsibilities</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Teamwork</strong><br>Collaborates effectively with colleagues</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Communication</strong><br>Expresses ideas clearly and listens effectively</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Problem Solving</strong><br>Identifies and resolves issues effectively</td><td>[1-5]</td><td>[Specific examples]</td></tr>
        <tr><td><strong>Adaptability</strong><br>Responds well to change and new challenges</td><td>[1-5]</td><td>[Specific examples]</td></tr>
      </table>
      
      <h3>Key Achievements</h3>
      <ul>
        <li><strong>[Achievement 1]:</strong> [Description of accomplishment and impact]</li>
        <li><strong>[Achievement 2]:</strong> [Description of accomplishment and impact]</li>
        <li><strong>[Achievement 3]:</strong> [Description of accomplishment and impact]</li>
      </ul>
      
      <h3>Areas for Development</h3>
      <ul>
        <li><strong>[Area 1]:</strong> [Description and suggested improvement actions]</li>
        <li><strong>[Area 2]:</strong> [Description and suggested improvement actions]</li>
        <li><strong>[Area 3]:</strong> [Description and suggested improvement actions]</li>
      </ul>
      
      <h2>Employee Comments</h2>
      <h3>Self-Assessment</h3>
      <p>[Employee's perspective on their performance during review period]</p>
      
      <h3>Challenges Faced</h3>
      <p>[Obstacles or challenges that affected performance]</p>
      
      <h3>Suggestions for Improvement</h3>
      <p>[Employee's suggestions for improving their performance or work environment]</p>
      
      <h3>Career Aspirations</h3>
      <p>[Employee's career goals and development interests]</p>
      
      <h2>Future Goals and Development Plan</h2>
      <h3>Next Period Goals</h3>
      <table style="width: 100%;">
        <tr><th>Goal</th><th>Measurement Criteria</th><th>Target Date</th><th>Resources Needed</th></tr>
        <tr><td>[SMART Goal 1]</td><td>[How success will be measured]</td><td>[Target completion]</td><td>[Support/resources]</td></tr>
        <tr><td>[SMART Goal 2]</td><td>[How success will be measured]</td><td>[Target completion]</td><td>[Support/resources]</td></tr>
        <tr><td>[SMART Goal 3]</td><td>[How success will be measured]</td><td>[Target completion]</td><td>[Support/resources]</td></tr>
      </table>
      
      <h3>Development Activities</h3>
      <ul>
        <li><strong>Training:</strong> [Specific training programs or courses]</li>
        <li><strong>Mentoring:</strong> [Mentorship opportunities]</li>
        <li><strong>Projects:</strong> [Stretch assignments or special projects]</li>
        <li><strong>Conferences:</strong> [Industry events or workshops]</li>
      </ul>
      
      <h2>Overall Rating</h2>
      <p><strong>Performance Rating:</strong> [Outstanding/Exceeds Expectations/Meets Expectations/Needs Improvement/Unsatisfactory]</p>
      
      <h3>Rating Justification</h3>
      <p>[Detailed explanation for overall rating with specific examples]</p>
      
      <h2>Signatures</h2>
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <p><strong>Employee Signature:</strong></p>
            <p>_________________________________</p>
            <p>Date: _________________</p>
          </td>
          <td style="width: 50%; vertical-align: top;">
            <p><strong>Manager Signature:</strong></p>
            <p>_________________________________</p>
            <p>Date: _________________</p>
          </td>
        </tr>
      </table>
      
      <p><em>Performance review conducted in accordance with company policies and procedures.</em></p>
    `
  },
  {
    title: 'Technical Documentation',
    description: 'Comprehensive technical documentation template',
    content: `
      <h1>Technical Documentation</h1>
      
      <h2>Document Information</h2>
      <table style="width: 100%; border: none;">
        <tr><td><strong>Document Title:</strong></td><td>[System/Feature Name]</td></tr>
        <tr><td><strong>Document Version:</strong></td><td>[Version Number]</td></tr>
        <tr><td><strong>Author:</strong></td><td>[Author Name]</td></tr>
        <tr><td><strong>Created Date:</strong></td><td>[Creation Date]</td></tr>
        <tr><td><strong>Last Updated:</strong></td><td>[Update Date]</td></tr>
        <tr><td><strong>Review Status:</strong></td><td>[Draft/Review/Approved]</td></tr>
      </table>
      
      <h2>Table of Contents</h2>
      <ol>
        <li><a href="#overview">Overview</a></li>
        <li><a href="#system-architecture">System Architecture</a></li>
        <li><a href="#installation">Installation Guide</a></li>
        <li><a href="#configuration">Configuration</a></li>
        <li><a href="#api-documentation">API Documentation</a></li>
        <li><a href="#user-guide">User Guide</a></li>
        <li><a href="#troubleshooting">Troubleshooting</a></li>
        <li><a href="#maintenance">Maintenance</a></li>
      </ol>
      
      <h2 id="overview">Overview</h2>
      <h3>Purpose</h3>
      <p>[Description of what this system/feature does and why it exists]</p>
      
      <h3>Scope</h3>
      <p>[Boundaries of what is covered in this documentation]</p>
      
      <h3>Target Audience</h3>
      <ul>
        <li><strong>Developers:</strong> [What developers need to know]</li>
        <li><strong>System Administrators:</strong> [What admins need to know]</li>
        <li><strong>End Users:</strong> [What users need to know]</li>
      </ul>
      
      <h3>Prerequisites</h3>
      <ul>
        <li><strong>Technical:</strong> [Required technical knowledge]</li>
        <li><strong>Software:</strong> [Required software/tools]</li>
        <li><strong>Hardware:</strong> [Hardware requirements]</li>
      </ul>
      
      <h2 id="system-architecture">System Architecture</h2>
      <h3>High-Level Architecture</h3>
      <p>[Description of overall system design and components]</p>
      
      <h3>Components</h3>
      <h4>[Component 1]</h4>
      <ul>
        <li><strong>Purpose:</strong> [What this component does]</li>
        <li><strong>Technology:</strong> [Technology stack used]</li>
        <li><strong>Dependencies:</strong> [What it depends on]</li>
        <li><strong>Interfaces:</strong> [How it communicates with other components]</li>
      </ul>
      
      <h4>[Component 2]</h4>
      <ul>
        <li><strong>Purpose:</strong> [What this component does]</li>
        <li><strong>Technology:</strong> [Technology stack used]</li>
        <li><strong>Dependencies:</strong> [What it depends on]</li>
        <li><strong>Interfaces:</strong> [How it communicates with other components]</li>
      </ul>
      
      <h3>Data Flow</h3>
      <p>[Description of how data flows through system]</p>
      
      <h3>Security Considerations</h3>
      <ul>
        <li><strong>Authentication:</strong> [How users are authenticated]</li>
        <li><strong>Authorization:</strong> [How access is controlled]</li>
        <li><strong>Data Protection:</strong> [How data is secured]</li>
        <li><strong>Compliance:</strong> [Regulatory requirements]</li>
      </ul>
      
      <h2 id="installation">Installation Guide</h2>
      <h3>System Requirements</h3>
      <h4>Hardware Requirements</h4>
      <ul>
        <li><strong>CPU:</strong> [Processor specifications]</li>
        <li><strong>RAM:</strong> [Memory requirements]</li>
        <li><strong>Storage:</strong> [Disk space requirements]</li>
        <li><strong>Network:</strong> [Network requirements]</li>
      </ul>
      
      <h4>Software Requirements</h4>
      <ul>
        <li><strong>Operating System:</strong> [Supported OS versions]</li>
        <li><strong>Runtime Environment:</strong> [Required runtime versions]</li>
        <li><strong>Dependencies:</strong> [Required libraries/frameworks]</li>
        <li><strong>Optional Software:</strong> [Recommended additional tools]</li>
      </ul>
      
      <h3>Installation Steps</h3>
      <ol>
        <li><strong>Step 1: [Installation Phase]</strong><br>
        [Detailed instructions with commands/screenshots]</li>
        <li><strong>Step 2: [Installation Phase]</strong><br>
        [Detailed instructions with commands/screenshots]</li>
        <li><strong>Step 3: [Installation Phase]</strong><br>
        [Detailed instructions with commands/screenshots]</li>
      </ol>
      
      <h3>Verification</h3>
      <p>[How to verify that installation was successful]</p>
      
      <h2 id="configuration">Configuration</h2>
      <h3>Configuration Files</h3>
      <h4>[Configuration File 1]</h4>
      <table style="width: 100%;">
        <tr><th>Parameter</th><th>Description</th><th>Default</th><th>Required</th></tr>
        <tr><td>[parameter]</td><td>[Description]</td><td>[default value]</td><td>[Yes/No]</td></tr>
        <tr><td>[parameter]</td><td>[Description]</td><td>[default value]</td><td>[Yes/No]</td></tr>
      </table>
      
      <h3>Environment Variables</h3>
      <ul>
        <li><strong>[VAR_NAME]:</strong> [Description and example value]</li>
        <li><strong>[VAR_NAME]:</strong> [Description and example value]</li>
      </ul>
      
      <h2 id="api-documentation">API Documentation</h2>
      <h3>Authentication</h3>
      <p>[How to authenticate API requests]</p>
      
      <h3>Endpoints</h3>
      <h4>[Endpoint Group]</h4>
      <h5>GET [endpoint-path]</h5>
      <p><strong>Description:</strong> [What this endpoint does]</p>
      <p><strong>Parameters:</strong></p>
      <ul>
        <li><code>[param]</code> (type) - [Description]</li>
      </ul>
      <p><strong>Response:</strong> [Response format and example]</p>
      
      <h5>POST [endpoint-path]</h5>
      <p><strong>Description:</strong> [What this endpoint does]</p>
      <p><strong>Request Body:</strong> [Request format and example]</p>
      <p><strong>Response:</strong> [Response format and example]</p>
      
      <h2 id="user-guide">User Guide</h2>
      <h3>Getting Started</h3>
      <p>[How users can start using the system]</p>
      
      <h3>Common Tasks</h3>
      <h4>[Task 1]</h4>
      <ol>
        <li>[Step 1]</li>
        <li>[Step 2]</li>
        <li>[Step 3]</li>
      </ol>
      
      <h4>[Task 2]</h4>
      <ol>
        <li>[Step 1]</li>
        <li>[Step 2]</li>
        <li>[Step 3]</li>
      </ol>
      
      <h2 id="troubleshooting">Troubleshooting</h2>
      <h3>Common Issues</h3>
      <table style="width: 100%;">
        <tr><th>Issue</th><th>Cause</th><th>Solution</th></tr>
        <tr><td>[Problem description]</td><td>[Root cause]</td><td>[Step-by-step solution]</td></tr>
        <tr><td>[Problem description]</td><td>[Root cause]</td><td>[Step-by-step solution]</td></tr>
      </table>
      
      <h3>Error Codes</h3>
      <ul>
        <li><strong>[Error Code]:</strong> [Description and resolution]</li>
        <li><strong>[Error Code]:</strong> [Description and resolution]</li>
      </ul>
      
      <h3>Debug Mode</h3>
      <p>[How to enable and use debug mode]</p>
      
      <h2 id="maintenance">Maintenance</h2>
      <h3>Regular Maintenance Tasks</h3>
      <ul>
        <li><strong>[Task 1]:</strong> [Frequency and procedure]</li>
        <li><strong>[Task 2]:</strong> [Frequency and procedure]</li>
      </ul>
      
      <h3>Backup and Recovery</h3>
      <p>[How to back up and restore the system]</p>
      
      <h3>Monitoring</h3>
      <p>[What to monitor and how to set up alerts]</p>
      
      <h2>Change Log</h2>
      <h3>Version [Version Number] - [Date]</h3>
      <ul>
        <li><strong>Added:</strong> [New features]</li>
        <li><strong>Changed:</strong> [Modified features]</li>
        <li><strong>Fixed:</strong> [Bug fixes]</li>
        <li><strong>Removed:</strong> [Deprecated features]</li>
      </ul>
      
      <h2>Support</h2>
      <p><strong>Technical Support:</strong> [Contact information]</p>
      <p><strong>Documentation Updates:</strong> [How to contribute to documentation]</p>
      <p><strong>Community:</strong> [Forums, chat rooms, etc.]</p>
      
      <p><em>Document last updated: [Date]</em></p>
    `
  }
]
