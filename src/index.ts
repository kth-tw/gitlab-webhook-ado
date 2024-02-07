import * as ff from '@google-cloud/functions-framework'
import AdoService from './ado'
import GitlabService from './gitlab'

ff.http('GitlabWebhookAdoFunction', async (req: ff.Request, res: ff.Response) => {
  if (req.headers['x-gitlab-token'] !== process.env.SECRET_TOKEN) {
    res.status(401).send()
    return
  }

  if (req.headers['x-gitlab-event'] === 'Merge Request Hook') {
    const workItemId = (req.body?.object_attributes?.title as string).match(/(?<=^ADO-)\d*(?= )/)?.[0]
    if (workItemId) {
      const adoService = new AdoService(
        req.query['ado-organization'] as string,
        req.query['ado-project'] as string,
        req.query['ado-backlog'] as string,
        process.env.ADO_TOKEN!,
      )

      const action = (() => {
        switch (req.body?.object_attributes?.action) {
          case 'open':
            return 'opened'
          case 'merge':
            return 'merged'
          default:
            return undefined
        }
      })()
      if (action) {
        await adoService.discussion(workItemId, `Merge request <a href="${req.body?.object_attributes?.url}">${req.body?.project?.name}!${req.body?.object_attributes?.iid}</a> is ${action}`)
      }

      if (req.body?.object_attributes?.action === 'open') {
        const workItem = await adoService.getWorkItem(workItemId)
        const gitlabService = new GitlabService(req.body?.project?.id, process.env.GITLAB_TOKEN!)
        await gitlabService.createIssueNote(req.body?.object_attributes?.iid, `link to Azure DevOps [${workItem?.type} #${workItem?.id}](${workItem?.url})`)
      }
    }
  }

  res.status(200).send()
})
