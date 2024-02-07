export default class AdoService {
  private config: { organization: string; project: string; backlog: string}
  private headers: any
  constructor (organization: string, project: string, backlog: string, token: string) {
    this.config = { organization, project, backlog }
    this.headers = {
      Authorization: `Basic ${Buffer.from(`:${token}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }
  }

  public async discussion (workItemId: number | string, text: string) {
    const response = await fetch(`https://dev.azure.com/${this.config.organization}/${this.config.project}/_apis/wit/workItems/${workItemId}/comments?api-version=7.0-preview.3`, {
      method: 'POST',
      body: JSON.stringify({
        text,
      }),
      headers: this.headers,
    })
    if (!response.ok) {
      console.error(await response.text())
    }
  }

  public async getWorkItem (workItemId: number | string) {
    const response = await fetch(`https://dev.azure.com/${this.config.organization}/${this.config.project}/_apis/wit/workItems/${workItemId}?api-version=7.0-preview.3`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      console.error(await response.text())
      return
    }

    const result = await response.json()
    return {
      id: result.id,
      title: result.fields['System.Title'],
      url: result._links.html.href,
    }
  }
}
