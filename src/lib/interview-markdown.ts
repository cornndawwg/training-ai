import { InterviewSession, InterviewResponse, Process, Role } from '@/types';

export interface MarkdownExportOptions {
  includeScreenshots?: boolean;
  screenshotBaseUrl?: string;
}

export function formatInterviewAsMarkdown(
  session: InterviewSession & {
    role: Role;
    process?: Process | null;
    interviewResponses?: InterviewResponse[];
  },
  options: MarkdownExportOptions = {}
): string {
  const { includeScreenshots = true, screenshotBaseUrl = '' } = options;
  
  let markdown = `# Interview: ${session.process?.title || 'Untitled Process'}\n\n`;
  
  markdown += `## Process Information\n`;
  markdown += `- Process: ${session.process?.title || 'N/A'}\n`;
  markdown += `- Role: ${session.role.title}\n`;
  markdown += `- Interview Date: ${new Date(session.startedAt).toLocaleDateString()}\n`;
  markdown += `- Status: ${session.status}\n`;
  if (session.process?.description) {
    markdown += `- Description: ${session.process.description}\n`;
  }
  markdown += `\n`;

  if (session.interviewResponses && session.interviewResponses.length > 0) {
    markdown += `## Questions and Responses\n\n`;

    session.interviewResponses.forEach((response, index) => {
      markdown += `### Question ${index + 1}: ${response.question}\n\n`;
      
      if (response.response) {
        markdown += `**Response:**\n${response.response}\n\n`;
      } else {
        markdown += `**Response:** _No response provided_\n\n`;
      }

      if (response.transcript) {
        markdown += `**Transcript:**\n${response.transcript}\n\n`;
      }

      // Handle screenshots
      if (includeScreenshots && response.screenshotUrls && Array.isArray(response.screenshotUrls)) {
        if (response.screenshotUrls.length > 0) {
          markdown += `**Screenshots:**\n\n`;
          response.screenshotUrls.forEach((url, screenshotIndex) => {
            const imageUrl = screenshotBaseUrl 
              ? `${screenshotBaseUrl}${url}`
              : url;
            markdown += `![Screenshot ${screenshotIndex + 1}](${imageUrl})\n\n`;
          });
        }
      }
    });

    markdown += `## Summary\n`;
    markdown += `- Total Questions: ${session.interviewResponses.length}\n`;
    const responsesWithAnswers = session.interviewResponses.filter(r => r.response).length;
    markdown += `- Total Responses: ${responsesWithAnswers}\n`;
    const totalScreenshots = session.interviewResponses.reduce((acc, r) => {
      return acc + (r.screenshotUrls && Array.isArray(r.screenshotUrls) ? r.screenshotUrls.length : 0);
    }, 0);
    markdown += `- Screenshots Attached: ${totalScreenshots}\n`;
  } else {
    markdown += `## Questions and Responses\n\n`;
    markdown += `_No responses recorded yet._\n`;
  }

  return markdown;
}
