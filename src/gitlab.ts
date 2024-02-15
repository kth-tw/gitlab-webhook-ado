export default class GitlabService {
  private config: { project: number }
  private headers: any
  constructor (project: number, token: string) {
    this.config = { project }
    this.headers = {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    }
  }

  private async createIssueNote (iid: number | string, text: string) {
    const response = await fetch(`https://gitlab.com/api/v4/projects/${this.config.project}/merge_requests/${iid}/notes`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        body: text,
      }),
    })
    if (!response.ok) {
      console.error(await response.text())
    }
  }

  public async linkToAdoComment (iid: number, type: string, id: number, url: string) {
    await this.createIssueNote(iid, `link to Azure DevOps [${type} #${id}](${url})`)
  }
}
