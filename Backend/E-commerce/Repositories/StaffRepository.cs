using E_commerce.Data;
using E_commerce.Models;
using E_commerce.Repositories.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.Repositories
{
    public class StaffRepository : IStaffRepository
    {
        private readonly AppDbContext _context;
        public StaffRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<User>> GetAllStaff()
        {
            return await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == "staff") && !u.IsDeleted)
                .ToListAsync();
        }

        public async Task<User?> GetStaffById(Guid id)
        {
            return await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == "staff") && !u.IsDeleted)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> EmailExists(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<Role?> GetStaffRole()
        {
            return await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == "staff");
        }

        public async Task AddStaff(User staff)
        {
            await _context.Users.AddAsync(staff);
        }

        public void DeleteStaff(User staff)
        {
            staff.IsDeleted = true;
            _context.Users.Update(staff);
        }
        public void UpdateStaff(User staff)
        {
            _context.Users.Update(staff);
        }

        public async Task<bool> SaveChanges()
        {
            return await _context.SaveChangesAsync() > 0;
        }
    }
}