export interface IPhotoStorage {
  save(bytes:Buffer):Promise<string>;
  remove(url:string):Promise<void>;
}
