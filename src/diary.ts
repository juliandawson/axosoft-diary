/**
 * Description for the file.
 * @author Julian Dawson <julian@changeinpractice.com>
 * @license MIT
 */
import * as rp from "request-promise";

/**
 * Description of the interface.
 * @interface
 */
export interface IDiary {
  apiUri: string;
  apiToken: string;
  apiProjectId: number;
  apiJson: boolean;
  taskDay: string;
  taskMonth: string;
  taskDate: string;
}

/**
   * Description of the class.
   * @class
   */
export class Diary implements IDiary {

  public apiUri: string;
  public apiToken: string;
  public apiProjectId: number;
  public apiJson: boolean;
  public taskDay: string;
  public taskMonth: string;
  public taskDate: string;

  /**
   * Description of the contructor.
   * @constructor
   * @param {object} config Description of the constructor argument.
   */
  constructor(config: IDiary) {
    this.apiUri = config.apiUri;
    this.apiToken = config.apiToken;
    this.apiProjectId = config.apiProjectId;
    this.apiJson = config.apiJson;
    this.taskDay = config.taskDay;
    this.taskMonth = config.taskMonth;
    this.taskDate = config.taskDate;
  }

  /**
   * Description of the method.
   * @method
   * @public
   */
  public run(date: any): void {
    this._handleSuccess(`Retrieving tasks...`)
    this._getTasks(date)
      .then(tasks => {
        // resolve array of promise returning functions
        tasks.reduce((cur, task) => cur.then(() => this._postTask(task)), Promise.resolve())
          .then(() => this._handleSuccess("Complete"))
          .catch(err => this._handleError(err));
      });
  }

  /**
   * Description of the method.
   * @method
   * @private
   */
  private _getTasks(date: any): Promise<any> {
    const options = {
      "method": "GET",
      "uri": `${this.apiUri}/tasks`,
      "qs": {
        "access_token": this.apiToken,
        "project_id": this.apiProjectId,
        "page_size": 20
      },
      "json": this.apiJson
    };
    let tasksForDate = [];

    return rp(options)
      .then(tasks => {
        tasks.data.forEach(task => {
          if (task.custom_fields[this.taskDay].indexOf(date.format("dddd")) !== -1 ||
            task.custom_fields[this.taskMonth].indexOf(date.format("MMMM")) !== -1 &&
            task.custom_fields[this.taskDate] === date.format("D")) {
            tasksForDate.push(task);
          }
        });

        this._handleSuccess(`Processing ${tasksForDate.length}/${tasks.data.length} tasks`)
        return tasksForDate;
      })
      .catch(err => this._handleError(err));
  }

  /**
   * Description of the method.
   * @method
   * @param {object} task Description of the method argument.
   * @private
   */
  private _postTask(task: any): Promise<any> {
    const options = {
      "method": "POST",
      "uri": `${this.apiUri}/incidents`,
      "qs": {
        "access_token": this.apiToken,
      },
      "body": {
        "item": {
          "name": task.name,
          "description": task.description,
          "assigned_to": {
            "type": task.assigned_to.type,
            "id": task.assigned_to.id,
          },
          "project": {
            "id": task.project.id,
          }
        },
      },
      "json": this.apiJson
    };

    return rp(options)
      .then(res => {
        this._handleSuccess(`- ${res.data.name}`)
        return res;
      })
      .catch(err => this._handleError(err));
  }

  /**
   * Description of the method.
   * @method
   * @param {any} error Description of the method argument.
   * @private
   */
  private _handleError(msg: any): void {
    console.log(msg);
  }

  /**
   * Description of the method.
   * @method
   * @param {any} success Description of the method argument.
   * @private
   */
  private _handleSuccess(msg: any): void {
    console.log(msg);
  }

}
