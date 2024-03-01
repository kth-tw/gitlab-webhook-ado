import * as ff from '@google-cloud/functions-framework'
import AdoService from './ado'
import GitlabService from './gitlab'

ff.http('GitlabWebhookAdoFunction', async (req: ff.Request, res: ff.Response) => {
  if (req.headers['x-gitlab-token'] !== process.env.SECRET_TOKEN) {
    res.status(401).send()
    return
  }

  const getWorkItemId = (title: string) => {
    const widString = (title).match(/(?<=ADO-)\d*(?= )/)?.[0]
    return widString === undefined ? undefined : parseInt(widString)
  }

  const mergeRequestComment = async (dto: {
    ado: {
      workItemId: number
    }
    gitlab: {
      url: string
      projectName: string
      iid: number
    }
    state: string
    skip?: {
      ado?: boolean
      gitlab?: boolean
    }
  }) => {
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

    if (!dto.skip?.ado) {
      await adoService.mergeRequestActionComment(dto.ado.workItemId, dto.gitlab.url, dto.gitlab.projectName, dto.gitlab.iid, dto.state)
    }
    if (!dto.skip?.gitlab) {
      const workItem = await adoService.getWorkItem(dto.ado.workItemId)
      if (workItem) {
        await gitlabService.linkToAdoComment(dto.gitlab.iid, workItem)
      }
    }
  }

  if (req.headers['x-gitlab-event'] === 'Merge Request Hook') {
    const workItemId = getWorkItemId(req.body?.object_attributes?.title as string)
    if (workItemId) {
      const mergeRequestCommentDto: Pick<Parameters<typeof mergeRequestComment>[0], 'ado' | 'gitlab'> = {
        ado: {
          workItemId,
        },
        gitlab: {
          url: req.body?.object_attributes?.url,
          projectName: req.body?.project?.name,
          iid: req.body?.object_attributes?.iid,
        },
      }

      if (req.body?.object_attributes?.action === 'open') {
        await mergeRequestComment({ ...mergeRequestCommentDto, state: 'opened' })
      }

      if (req.body?.object_attributes?.action === 'close') {
        await mergeRequestComment({ ...mergeRequestCommentDto, state: 'closed', skip: { gitlab: true } })
      }

      if (req.body?.object_attributes?.action === 'merge') {
        await mergeRequestComment({ ...mergeRequestCommentDto, state: 'merged', skip: { gitlab: true } })
      }
    }
  }

  if (req.headers['x-gitlab-event'] === 'Note Hook') {
    if (req.body?.object_attributes?.noteable_type === 'MergeRequest' && req.body?.object_attributes?.note === '#LINKTOADO') {
      const workItemId = getWorkItemId(req.body?.merge_request?.title as string)
      if (workItemId) {
        await mergeRequestComment({
          ado: {
            workItemId,
          },
          gitlab: {
            url: req.body?.merge_request?.url,
            projectName: req.body?.project?.name,
            iid: req.body?.merge_request?.iid,
          },
          state: req.body?.merge_request?.state,
        })
      }
    }
  }

  res.status(200).send()
})
