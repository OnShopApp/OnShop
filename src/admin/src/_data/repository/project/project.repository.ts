import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ProjectEntity} from './entity';
import {BaseRepository} from '../base.repository';

@Injectable({
  providedIn: 'root'
})
export class ProjectRepository extends BaseRepository {

  constructor(private httpClient: HttpClient) {
    super();
  }

  public getProjects(): Observable<Array<ProjectEntity>> {
    return this.httpClient
      .get<Array<any>>(`${this.apiBaseUrl}/wp-json/onshop/v1/project`, {
        headers: {
          Authorization: 'Bearer ' + this.token
        }
      })
      .pipe(map(dtos => {
        const result = [];
        for (const item of dtos) {
          const entity = new ProjectEntity();
          entity.mapFromDto(item);
          result.push(entity);
        }
        return result;
      }));
  }

  public getProjectById(id: number) {
    return this.httpClient.get<any>(`${this.apiBaseUrl}/wp-json/onshop/v1/project/` + id, {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    });
  }

  public addProject(project) {
    return this.httpClient.post(`${this.apiBaseUrl}/wp-json/onshop/v1/project`, project, {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    });
  }

  public deleteProject(id: number) {
    return this.httpClient.delete(`${this.apiBaseUrl}/wp-json/onshop/v1/project/` + id, {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    });
  }

  public getProjectUsers(id: number) {
    return this.httpClient.get(`${this.apiBaseUrl}/wp-json/onshop/v1/project/` + id + '/users', {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    });
  }
}
