using E_commerce.Data;
using E_commerce.DTOs.Admin;
using E_commerce.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace E_commerce.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _context;

        public AdminService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserListResponseDto>> GetUsersByRoleAsync(string roleName)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == roleName))
                .Select(u => new UserListResponseDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    RoleName = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? ""
                })
                .ToListAsync();
        }
    }
}