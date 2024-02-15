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
      const gitlabService = new GitlabService(
        req.body?.project?.id,
        process.env.GITLAB_TOKEN!,
      )

      if (req.body?.object_attributes?.action === 'open') {
        await adoService.mergeRequestActionComment(workItemId, req.body?.object_attributes?.url, req.body?.project?.name, req.body?.object_attributes?.iid, 'opened')

        const workItem = await adoService.getWorkItem(workItemId)
        await gitlabService.linkToAdoComment(req.body?.object_attributes?.iid, workItem?.type, workItem?.id, workItem?.url)
      }

      if (req.body?.object_attributes?.action === 'merge') {
        await adoService.mergeRequestActionComment(workItemId, req.body?.object_attributes?.url, req.body?.project?.name, req.body?.object_attributes?.iid, 'merged')
      }
    }
  }

  res.status(200).send()
})
