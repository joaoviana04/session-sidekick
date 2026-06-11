
create policy "Users can upload own attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own attachments"
  on storage.objects for update
  using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own attachments"
  on storage.objects for delete
  using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can read attachments"
  on storage.objects for select
  using (bucket_id = 'attachments');
