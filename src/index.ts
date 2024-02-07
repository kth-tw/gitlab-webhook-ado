import * as ff from '@google-cloud/functions-framework'

ff.http('GitlabWebhookAdoFunction', (req: ff.Request, res: ff.Response) => {
  res.send('OK')
})
